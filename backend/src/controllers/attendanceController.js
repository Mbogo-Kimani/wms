const Employee = require('../models/Employee');
const Shift = require('../models/Shift');
const Attendance = require('../models/Attendance');
const CompanySettings = require('../models/CompanySettings');
const { getDistanceFromLatLonInMeters } = require('../utils/geoUtils');
const dayjs = require('dayjs');
const { isHoliday } = require('../utils/dateUtils');
const logAction = require('../utils/auditLogger');

// Helper to verify WiFi (Placeholder)
const verifyWifi = (req) => {
  const allowedWifiSSID = process.env.ALLOWED_WIFI_SSID || 'Company_Guest';
  const clientSSID = req.body.ssid;
  return clientSSID === allowedWifiSSID;
};

exports.signIn = async (req, res) => {
  try {
    const { lat, lng, ssid } = req.body;
    const employee = await Employee.findOne({ userId: req.user.id }).populate('shiftId');
    if (!employee) return res.status(404).json({ error: 'Employee profile not found' });

    const shift = employee.shiftId;
    const settings = await CompanySettings.findOne();
    let locationVerified = false;

    if (verifyWifi(req)) {
      locationVerified = true;
    } else {
      if (shift.location && shift.location.lat !== 0 && lat && lng) {
        const distance = getDistanceFromLatLonInMeters(lat, lng, shift.location.lat, shift.location.lng);
        if (distance <= shift.location.radius) locationVerified = true;
      }
      if (!locationVerified && settings && lat && lng) {
        const distance = getDistanceFromLatLonInMeters(lat, lng, settings.latitude, settings.longitude);
        if (distance <= settings.allowedRadiusMeters) locationVerified = true;
      }
    }

    if (!locationVerified) {
      if (!lat && !lng && !ssid) {
        console.warn('Bypassing location verification for local testing.');
        locationVerified = true;
      } else {
        return res.sendError('Location verification failed. You must be within GPS radius or on company WiFi.', 403);
      }
    }

    const WorkPolicy = require('../models/WorkPolicy');
    const { isWeekend, isHoliday } = require('../utils/dateUtils');
    const now = dayjs();
    const today = now.startOf('day').toDate();

    const policy = await WorkPolicy.findById(employee.workPolicy) || await WorkPolicy.findOne({ isDefault: true });
    const holidayToday = await isHoliday(now.toDate());
    const weekendToday = await isWeekend(now.toDate());
    const dayName = now.format('dddd');

    if (employee.religiousRestDay === dayName && !req.body.religiousOverride) {
      return res.status(403).json({ 
        success: false,
        message: `Attendance is restricted. Today is your religious rest day (${dayName}).`,
        requiresOverride: true 
      });
    }

    if (weekendToday && !employee.weekendWorker) {
      return res.sendError('You are not scheduled for weekend work. Attendance restricted.', 403);
    }

    if (holidayToday && !employee.holidayWorker) {
      return res.sendError('Attendance is restricted on public holidays for your profile.', 403);
    }

    let status = 'present';
    if (policy) {
      let startTime, endTime;
      if (holidayToday) {
        startTime = policy.holidayLoginStart;
        endTime = policy.holidayLoginEnd;
      } else if (weekendToday) {
        startTime = policy.weekendLoginStart;
        endTime = policy.weekendLoginEnd;
      } else {
        startTime = policy.regularLoginStart;
        endTime = policy.regularLoginEnd;
      }

      const todayStr = now.format('YYYY-MM-DD');
      const startLimit = dayjs(`${todayStr} ${startTime}`);
      const endLimit = dayjs(`${todayStr} ${endTime}`);

      if (now.isBefore(startLimit)) {
        return res.sendError(`Login window opens at ${startTime}. Please wait.`, 403);
      }
      if (now.isAfter(endLimit)) {
         return res.sendError(`Login window for this shift closed at ${endTime}.`, 403);
      }
      if (now.isAfter(startLimit.add(policy.gracePeriodMinutes || 15, 'minute'))) {
        status = 'late';
      }
    }

    if (holidayToday) status = 'holiday_work';
    else if (weekendToday) status = 'weekend_work';

    const existing = await Attendance.findOne({ employeeId: employee._id, date: today });
    if (existing) return res.sendError('Already signed in today.', 400);

    const attendance = await Attendance.create({
      employeeId: employee._id,
      shiftId: shift._id,
      date: today,
      signInTime: now.toDate(),
      signInLocation: { lat, lng },
      signInMethod: req.body.method || 'mobile',
      isHolidayWork: holidayToday,
      isWeekendWork: weekendToday,
      religiousOverride: !!req.body.religiousOverride,
      status
    });

    await logAction(req, 'attendance_signin', 'Attendance', attendance._id, { method: req.body.method });
    res.sendSuccess(attendance, 'Signed in successfully');
  } catch (error) {
    res.sendError(error.message, 500);
  }
};

exports.signOut = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const employee = await Employee.findOne({ userId: req.user.id }).populate('shiftId');
    if (!employee) return res.sendError('Employee profile not found', 404);
    const today = dayjs().startOf('day').toDate();

    const attendance = await Attendance.findOne({ employeeId: employee._id, date: today });
    if (!attendance) return res.sendError('No sign-in record found for today.', 404);

    const shift = employee.shiftId;
    if (shift && shift.location && shift.location.lat && lat && lng) {
      const distance = getDistanceFromLatLonInMeters(lat, lng, shift.location.lat, shift.location.lng);
      if (distance > shift.location.radius) {
        return res.sendError(`Too far from workplace. Detected: ${Math.round(distance)}m away.`, 400);
      }
    }

    if (attendance.signOutTime) return res.sendError('Already signed out.', 400);

    const now = dayjs();
    const [endHour, endMin] = shift.endTime.split(':');
    const shiftEndTime = dayjs(today).hour(endHour).minute(endMin).second(0);
    const overtimeThreshold = shiftEndTime.add(shift.overtimeAfterMinutes || 0, 'minute');

    let overtimeMinutes = 0;
    if (now.isAfter(overtimeThreshold)) {
      overtimeMinutes = now.diff(shiftEndTime, 'minute');
      attendance.status = 'overtime';
    }

    attendance.signOutTime = now.toDate();
    attendance.signOutLocation = { lat, lng };
    attendance.overtimeMinutes = overtimeMinutes;
    await attendance.save();

    res.sendSuccess(attendance, 'Signed out successfully');
  } catch (error) {
    res.sendError(error.message, 500);
  }
};

exports.getTodayAttendance = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) return res.sendSuccess({});
    
    const today = dayjs().startOf('day').toDate();
    const attendance = await Attendance.findOne({ employeeId: employee._id, date: today });
    res.sendSuccess(attendance || {});
  } catch (error) {
    res.sendError(error.message, 500);
  }
};

exports.getWorkerHistory = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) return res.sendError('Employee profile not found', 404);

    const history = await Attendance.find({ employeeId: employee._id })
      .populate('shiftId', 'name startTime endTime')
      .sort({ date: -1 })
      .limit(30);

    res.sendSuccess(history);
  } catch (error) {
    res.sendError(error.message, 500);
  }
};

exports.getAllHistory = async (req, res) => {
  try {
    const history = await Attendance.find()
      .populate('employeeId', 'name employeeId department')
      .populate('shiftId', 'name startTime endTime')
      .sort({ date: -1 })
      .limit(100);

    res.sendSuccess(history);
  } catch (error) {
    res.sendError(error.message, 500);
  }
};