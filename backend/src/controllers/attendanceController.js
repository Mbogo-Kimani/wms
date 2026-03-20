const Employee = require('../models/Employee');
const Shift = require('../models/Shift');
const Attendance = require('../models/Attendance');
const CompanySettings = require('../models/CompanySettings');
const { getDistanceFromLatLonInMeters } = require('../utils/geoUtils');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);
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
    const companyTz = settings?.timezone || 'UTC';
    const now = dayjs().tz(companyTz);
    
    const WorkPolicy = require('../models/WorkPolicy');
    const { isWeekend, isHoliday } = require('../utils/dateUtils');
    const policy = await WorkPolicy.findById(employee.workPolicy) || await WorkPolicy.findOne({ isDefault: true });
    const holidayToday = await isHoliday(now);
    const weekendToday = await isWeekend(now);
    const dayName = now.format('dddd');
    const todayStr = now.format('YYYY-MM-DD');

    if (employee.religiousRestDay === dayName && !req.body.religiousOverride) {
      return res.status(403).json({ 
        success: false,
        message: `Attendance is restricted. Today is your religious rest day (${dayName}). (Override required)`,
        requiresOverride: true 
      });
    }

    if (weekendToday && !employee.weekendWorker) {
      return res.sendError(`You are not scheduled for weekend work. Attendance restricted. (Today: ${dayName})`, 403);
    }

    if (holidayToday && !employee.holidayWorker) {
      return res.sendError(`Attendance is restricted on public holidays for your profile. (Date: ${now.format('YYYY-MM-DD')})`, 403);
    }

    let status = 'present';
    let workDate = todayStr;

    if (policy) {
      let startTime, endTime;
      if (holidayToday) {
        startTime = policy.holidayLoginStart;
        endTime = policy.holidayLoginEnd;
      } else if (weekendToday) {
        startTime = policy.weekendLoginStart;
        endTime = policy.weekendLoginEnd;
      } else if (shift && shift.startTime && shift.endTime) {
        // Dynamic window based on actual shift!
        try {
          startTime = dayjs(`2000-01-01 ${shift.startTime}`).subtract(1, 'hour').format('HH:mm');
          endTime = shift.endTime;
        } catch (e) {
          startTime = policy.regularLoginStart;
          endTime = policy.regularLoginEnd;
        }
      } else {
        startTime = policy.regularLoginStart;
        endTime = policy.regularLoginEnd;
      }

      // Window Today
      let startToday = dayjs(`${todayStr} ${startTime}`);
      let endToday = dayjs(`${todayStr} ${endTime}`);
      if (endToday.isBefore(startToday)) endToday = endToday.add(1, 'day');

      // Window Yesterday
      let startYesterday = startToday.subtract(1, 'day');
      let endYesterday = endToday.subtract(1, 'day');

      const isWithinToday = (now.isSame(startToday) || now.isAfter(startToday)) && now.isBefore(endToday);
      const isWithinYesterday = (now.isSame(startYesterday) || now.isAfter(startYesterday)) && now.isBefore(endYesterday);

      if (!isWithinToday && !isWithinYesterday) {
        return res.sendError(`Login window is currently closed. (Shift: ${shift?.name || 'Policy'} ${startTime}-${endTime}). Current time: ${now.format('HH:mm')}`, 403);
      }

      // Determine Primary Window for Lateness and Work Date
      const primaryStartLimit = isWithinToday ? startToday : startYesterday;
      workDate = dayjs(primaryStartLimit).format('YYYY-MM-DD'); // Use string format for consistent UTC-midnight interpretation

      // Check for lateness
      const gracePeriod = policy.gracePeriodMinutes || 15;
      let latenessBase = primaryStartLimit;
      if (shift && shift.startTime && !holidayToday && !weekendToday) {
        latenessBase = dayjs(primaryStartLimit).add(1, 'hour'); 
      }

      if (now.isAfter(latenessBase.add(gracePeriod, 'minute'))) {
        status = 'late';
      }
    }

    if (holidayToday) status = 'holiday_work';
    else if (weekendToday) status = 'weekend_work';

    const existing = await Attendance.findOne({ employeeId: employee._id, date: workDate });
    
    if (existing) {
      if (existing.status === 'absent') {
        // Overwrite the auto-generated absent record
        existing.signInTime = now.toDate();
        existing.signInLocation = { lat, lng };
        existing.signInMethod = req.body.method || 'mobile';
        existing.status = status;
        existing.isHolidayWork = holidayToday;
        existing.isWeekendWork = weekendToday;
        existing.religiousOverride = !!req.body.religiousOverride;
        await existing.save();
        
        await logAction(req, 'attendance_signin_update', 'Attendance', existing._id, { method: req.body.method, wasAbsent: true });
        return res.sendSuccess(existing, 'Signed in successfully (Updated from absent)');
      } else {
        return res.sendError('Already signed in for this work day.', 400);
      }
    }

    const attendance = await Attendance.create({
      employeeId: employee._id,
      shiftId: shift._id,
      date: workDate,
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
    const settings = await CompanySettings.findOne();
    const companyTz = settings?.timezone || 'UTC';
    const now = dayjs().tz(companyTz);
    const todayStr = now.format('YYYY-MM-DD');
    const yesterdayStr = now.subtract(1, 'day').format('YYYY-MM-DD');

    // Look for active attendance record (today or yesterday for night shifts)
    const attendance = await Attendance.findOne({ 
      employeeId: employee._id, 
      date: { $in: [todayStr, yesterdayStr] },
      signOutTime: { $exists: false }
    }).sort({ date: -1 });

    if (!attendance) return res.sendError('No active sign-in record found for today or yesterday.', 404);

    // Verification bypassed as requested
    // const shift = employee.shiftId;
    // if (shift && shift.location && shift.location.lat && lat && lng) {
    //   const distance = getDistanceFromLatLonInMeters(lat, lng, shift.location.lat, shift.location.lng);
    //   if (distance > shift.location.radius) {
    //     return res.sendError(`Too far from workplace. Detected: ${Math.round(distance)}m away.`, 400);
    //   }
    // }

    if (attendance.signOutTime) return res.sendError('Already signed out.', 400);

    const shift = employee.shiftId;
    let overtimeMinutes = 0;

    if (shift && shift.endTime) {
      try {
        const [endHour, endMin] = shift.endTime.split(':');
        const [startHour, startMin] = (shift.startTime || "00:00").split(':');
        
        let shiftEndTime = dayjs(attendance.date).hour(parseInt(endHour)).minute(parseInt(endMin)).second(0);
        
        // If end time is before start time, it crosses midnight
        if (parseInt(endHour) < parseInt(startHour)) {
          shiftEndTime = shiftEndTime.add(1, 'day');
        }

        const overtimeThreshold = shiftEndTime.add(shift.overtimeAfterMinutes || 0, 'minute');

        if (now.isAfter(overtimeThreshold)) {
          overtimeMinutes = now.diff(shiftEndTime, 'minute');
          attendance.status = 'overtime';
        }
      } catch (err) {
        console.error('Error calculating overtime during sign-out:', err);
      }
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
    
    const settings = await CompanySettings.findOne();
    const companyTz = settings?.timezone || 'UTC';
    const now = dayjs().tz(companyTz);
    const todayStr = now.format('YYYY-MM-DD');
    const yesterdayStr = now.subtract(1, 'day').format('YYYY-MM-DD');

    // 1. Prioritize an active session (today or yesterday)
    let attendance = await Attendance.findOne({ 
      employeeId: employee._id, 
      date: { $in: [todayStr, yesterdayStr] },
      signOutTime: { $exists: false }
    }).sort({ date: -1 });

    // 2. If no active session, look for ANY record on TODAY specifically
    if (!attendance) {
      attendance = await Attendance.findOne({ 
        employeeId: employee._id, 
        date: todayStr 
      });
    }

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