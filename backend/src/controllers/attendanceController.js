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
    let lateSignInMinutes = 0;
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
    const WorkSchedule = require('../models/WorkSchedule');
    
    // Use UTC midnight of the DATE string to match how schedules are stored
    const todayMidnight = dayjs.utc(todayStr).toDate();
    const schedule = await WorkSchedule.findOne({ employeeId: employee._id, date: todayMidnight }).populate('shiftId');

    const effectiveShift = schedule?.shiftId || shift;
    const isWeekendOverride = schedule?.isWeekendShift;
    const isHolidayOverride = schedule?.isHolidayShift;

    if (employee.religiousRestDay === dayName && !req.body.religiousOverride && !schedule) {
      return res.status(403).json({ 
        success: false,
        message: `Attendance is restricted. Today is your religious rest day (${dayName}). (Override required)`,
        requiresOverride: true 
      });
    }

    if (weekendToday && !employee.weekendWorker && !isWeekendOverride) {
      return res.sendError(`You are not scheduled for weekend work. Attendance restricted. (Today: ${dayName})`, 403);
    }

    if (holidayToday && !employee.holidayWorker && !isHolidayOverride) {
      return res.sendError(`Attendance is restricted on public holidays for your profile. (Date: ${now.format('YYYY-MM-DD')})`, 403);
    }

    let status = 'present';
    let workDate = todayStr;

    if (policy) {
      let startTime, endTime;
      if (schedule && schedule.shiftId) {
        // Use scheduled shift!
        startTime = dayjs(`2000-01-01 ${schedule.shiftId.startTime}`).subtract(1, 'hour').format('HH:mm');
        endTime = schedule.shiftId.endTime;
      } else if (holidayToday) {
        startTime = policy.holidayLoginStart;
        endTime = policy.holidayLoginEnd;
      } else if (weekendToday) {
        startTime = policy.weekendLoginStart;
        endTime = policy.weekendLoginEnd;
      } else if (effectiveShift && effectiveShift.startTime && effectiveShift.endTime) {
        // Dynamic window based on actual shift!
        try {
          startTime = dayjs(`2000-01-01 ${effectiveShift.startTime}`).subtract(1, 'hour').format('HH:mm');
          endTime = effectiveShift.endTime;
        } catch (e) {
          startTime = policy.regularLoginStart;
          endTime = policy.regularLoginEnd;
        }
      } else {
        startTime = policy.regularLoginStart;
        endTime = policy.regularLoginEnd;
      }

      // Window Today
      let startToday = dayjs.tz(`${todayStr} ${startTime}`, companyTz);
      let endToday = dayjs.tz(`${todayStr} ${endTime}`, companyTz);
      if (endToday.isBefore(startToday)) endToday = endToday.add(1, 'day');

      // Window Yesterday
      let startYesterday = startToday.subtract(1, 'day');
      let endYesterday = endToday.subtract(1, 'day');

      const isWithinToday = (now.isSame(startToday) || now.isAfter(startToday)) && now.isBefore(endToday);
      const isWithinYesterday = (now.isSame(startYesterday) || now.isAfter(startYesterday)) && now.isBefore(endYesterday);

      if (!isWithinToday && !isWithinYesterday) {
        return res.sendError(`Login window is currently closed. (Shift: ${effectiveShift?.name || 'Policy'} ${startTime}-${endTime}). Current time: ${now.format('HH:mm')}`, 403);
      }

      // Determine Primary Window for Lateness and Work Date
      const primaryStartLimit = isWithinToday ? startToday : startYesterday;
      workDate = dayjs(primaryStartLimit).format('YYYY-MM-DD'); // Use string format for consistent UTC-midnight interpretation

      // Check for lateness
      const gracePeriod = policy.gracePeriodMinutes || 15;
      let latenessBase = primaryStartLimit;
      if (effectiveShift && effectiveShift.startTime && !holidayToday && !weekendToday) {
        latenessBase = dayjs(primaryStartLimit).add(1, 'hour'); 
      }

      if (now.isAfter(latenessBase.add(gracePeriod, 'minute'))) {
        status = 'late';
        lateSignInMinutes = now.diff(latenessBase, 'minute');
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
        existing.lateSignInMinutes = lateSignInMinutes;
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
      shiftId: effectiveShift._id,
      date: workDate,
      signInTime: now.toDate(),
      signInLocation: { lat, lng },
      signInMethod: req.body.method || 'mobile',
      isHolidayWork: holidayToday,
      isWeekendWork: weekendToday,
      religiousOverride: !!req.body.religiousOverride,
      status,
      lateSignInMinutes
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
    let rawOvertime = 0;
    let overtimeMinutes = 0;
    let finalStatus = attendance.status;
    let adjustmentApplied = 0;

    if (shift && shift.endTime) {
      try {
        const [endHour, endMin] = shift.endTime.split(':');
        const [startHour, startMin] = (shift.startTime || "00:00").split(':');
        
        let shiftEndTime = dayjs.tz(attendance.date, companyTz).hour(parseInt(endHour)).minute(parseInt(endMin)).second(0);
        
        if (parseInt(endHour) < parseInt(startHour)) {
          shiftEndTime = shiftEndTime.add(1, 'day');
        }

        if (now.isAfter(shiftEndTime)) {
          rawOvertime = now.diff(shiftEndTime, 'minute');
          const lateMins = attendance.lateSignInMinutes || 0;

          if (lateMins > 0) {
            adjustmentApplied = lateMins;
            const balance = rawOvertime - lateMins;

            if (balance > 0) {
              overtimeMinutes = balance;
              finalStatus = 'overtime';
            } else if (balance < 0) {
              overtimeMinutes = 0;
              finalStatus = 'late';
            } else {
              overtimeMinutes = 0;
              finalStatus = 'present';
            }
          } else {
            overtimeMinutes = rawOvertime;
            finalStatus = 'overtime';
          }
        }
      } catch (err) {
        console.error('Error calculating overtime during sign-out:', err);
      }
    }

    attendance.signOutTime = now.toDate();
    attendance.signOutLocation = { lat, lng };
    attendance.signOutMethod = req.body.method || 'mobile';
    attendance.overtimeMinutes = overtimeMinutes;
    attendance.status = finalStatus;
    await attendance.save();

    res.sendSuccess({
        attendance,
        summary: {
            status: finalStatus,
            rawOvertime,
            lateSignInMinutes: attendance.lateSignInMinutes || 0,
            adjustmentApplied,
            finalOvertime: overtimeMinutes
        }
    }, 'Signed out successfully');
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
    const { date, status, shiftType } = req.query;
    let query = {};

    if (date) {
      query.date = date;
    }

    if (status === 'ongoing') {
      query.signOutTime = { $exists: false };
      // Ongoing usually implies recent, so we check today and yesterday
      const settings = await CompanySettings.findOne();
      const companyTz = settings?.timezone || 'UTC';
      const now = dayjs().tz(companyTz);
      const today = now.format('YYYY-MM-DD');
      const yesterday = now.subtract(1, 'day').format('YYYY-MM-DD');
      query.date = { $in: [today, yesterday] };
    } else if (status && status !== 'all') {
      query.status = status;
    }

    let history = await Attendance.find(query)
      .populate('employeeId', 'name employeeId department')
      .populate('shiftId', 'name startTime endTime')
      .sort({ date: -1, signInTime: -1 });

    // Optional Shift Type filtering (Post-query for simplicity)
    if (shiftType === 'night') {
      history = history.filter(h => {
        if (!h.shiftId) return false;
        const [startH] = h.shiftId.startTime.split(':');
        const [endH] = h.shiftId.endTime.split(':');
        return parseInt(endH) < parseInt(startH);
      });
    } else if (shiftType === 'day') {
      history = history.filter(h => {
        if (!h.shiftId) return true; // Default to day?
        const [startH] = h.shiftId.startTime.split(':');
        const [endH] = h.shiftId.endTime.split(':');
        return parseInt(endH) >= parseInt(startH);
      });
    }

    res.sendSuccess(history);
  } catch (error) {
    res.sendError(error.message, 500);
  }
};