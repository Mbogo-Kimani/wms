const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const CompanySettings = require('../models/CompanySettings');
dayjs.extend(utc);
dayjs.extend(timezone);

exports.getAttendanceOverview = async (req, res) => {
  try {
    const settings = await CompanySettings.findOne();
    const companyTz = settings?.timezone || 'UTC';
    const now = dayjs().tz(companyTz);
    const today = now.startOf('day').toDate();
    const todayStr = now.format('YYYY-MM-DD');

    const last7DaysDates = [];
    for (let i = 0; i < 7; i++) {
        last7DaysDates.push(now.subtract(i, 'day').startOf('day').toDate());
    }
    
    const totalEmployees = await Employee.countDocuments({ status: 'active' });

    // Find the latest day with ANY activity in the last 7 days
    const latestActivity = await Attendance.findOne({ 
        date: { $in: last7DaysDates },
        status: { $in: ['present', 'late', 'holiday_work', 'absent'] }
    }).sort({ date: -1 });

    const dashboardDate = latestActivity ? latestActivity.date : today;
    
    // 1. Intelligence Metrics - Use 7-Day Context for Rates IF today is empty
    const sevenDayStats = await Attendance.aggregate([
      { $match: { date: { $in: last7DaysDates } } },
      { $group: {
        _id: null,
        totalPresent: { $sum: { $cond: [{ $in: ['$status', ['present', 'late', 'holiday_work']] }, 1, 0] } },
        totalLate: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
        totalAbsent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        activeDays: { $addToSet: '$date' }
      }}
    ]);

    const stats7 = sevenDayStats[0] || { totalPresent: 0, totalLate: 0, totalAbsent: 0, activeDays: [] };
    const activeDayCount = stats7.activeDays.length || 1;
    const baseDivisor = activeDayCount * totalEmployees;

    // 2. DASHBOARD STATUS (Synchronized with Ongoing shifts)
    const todayStats = await Attendance.aggregate([
      { $match: { date: todayStr } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const yesterdayStr = now.subtract(1, 'day').format('YYYY-MM-DD');
    const activeSessions = await Attendance.countDocuments({
      signInTime: { $exists: true },
      signOutTime: { $exists: false },
      date: { $in: [todayStr, yesterdayStr] }
    });

    const getTodayCount = (statusArr) => {
      if (Array.isArray(statusArr)) {
        return todayStats.filter(s => statusArr.includes(s._id)).reduce((acc, curr) => acc + curr.count, 0);
      }
      return todayStats.find(s => s._id === statusArr)?.count || 0;
    };

    const presentT = activeSessions; // Strictly currently on-site
    const lateT = getTodayCount('late');
    const absentT = getTodayCount('absent');

    const leaveT = await LeaveRequest.countDocuments({
        status: 'approved',
        startDate: { $lte: today },
        endDate: { $gte: today }
    });

    const calculatedAbsenceT = Math.max(0, totalEmployees - (presentT + leaveT));

    // 3. Trends (Current 7 vs Prev 7)
    const prev7DaysDates = [];
    for (let i = 7; i < 14; i++) {
        prev7DaysDates.push(dayjs.utc().subtract(i, 'day').startOf('day').toDate());
    }

    const prev7DayStats = await Attendance.aggregate([
        { $match: { date: { $in: prev7DaysDates } } },
        { $group: {
          _id: null,
          totalPresent: { $sum: { $cond: [{ $in: ['$status', ['present', 'late', 'holiday_work']] }, 1, 0] } }
        }}
    ]);
    const p7 = prev7DayStats[0] || { totalPresent: 0 };

    const calculateTrend = (current, previous) => {
        if (!previous || previous === 0) return { value: '0%', isUp: true };
        const diff = ((current - previous) / previous) * 100;
        return { value: `${Math.abs(Math.round(diff))}%`, isUp: diff >= 0 };
    };

    // 4. Reliability (Global)
    const employees = await Employee.find({ status: 'active' });
    const attendanceRecords = await Attendance.aggregate([
        { $match: { status: { $in: ['late', 'absent'] } } },
        { $group: {
          _id: '$employeeId',
          lateCount: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
          absenceCount: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } }
        }}
    ]);

    const reliabilityScores = employees.map(emp => {
        const s = attendanceRecords.find(r => r._id.toString() === emp._id.toString()) || { lateCount: 0, absenceCount: 0 };
        return Math.max(0, 100 - (s.lateCount * 2) - (s.absenceCount * 5));
    });
    const avgReliability = reliabilityScores.length > 0 ? (reliabilityScores.reduce((a, b) => a + b, 0) / reliabilityScores.length).toFixed(1) : "0.0";

    res.sendSuccess({
      attendanceRate: totalEmployees > 0 ? Math.round((stats7.totalPresent / baseDivisor) * 100) : 100,
      lateRate: stats7.totalPresent > 0 ? Math.round((stats7.totalLate / stats7.totalPresent) * 100) : 0,
      absenceRate: baseDivisor > 0 ? Math.round((stats7.totalAbsent / baseDivisor) * 100) : 0,
      avgReliability,
      trends: {
        attendance: calculateTrend(stats7.totalPresent, p7.totalPresent),
        late: { value: `${stats7.totalLate} total`, isUp: false },
        absence: { value: `${stats7.totalAbsent} total`, isUp: false },
        reliability: { value: '2.4%', isUp: true }
      },
      details: { present: presentT, late: lateT, absent: calculatedAbsenceT, onLeave: leaveT, total: totalEmployees }
    });
  } catch (error) {
    res.sendError(error.message, 500);
  }
};

exports.getWorkforceSummary = async (req, res) => {
  try {
    const summary = await Employee.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    res.sendSuccess(summary);
  } catch (error) {
    res.sendError(error.message, 500);
  }
};

exports.getDepartmentAttendance = async (req, res) => {
  try {
    const todayDate = dayjs.utc().startOf('day').toDate();
    const yesterdayDate = dayjs.utc().subtract(1, 'day').startOf('day').toDate();

    const stats = await Attendance.aggregate([
      { $match: { 
        $or: [
          { date: todayDate },
          { date: yesterdayDate, signOutTime: { $exists: false } }
        ]
      }},
      { $lookup: { from: 'employees', localField: 'employeeId', foreignField: '_id', as: 'employee' } },
      { $unwind: '$employee' },
      { $group: { _id: '$employee.department', present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late', 'holiday_work']] }, 1, 0] } } } }
    ]);

    const allDepts = await Employee.distinct('department', { status: 'active' });
    const fullStats = allDepts.map(dept => {
        const found = stats.find(s => s._id === dept);
        return { _id: dept, present: found ? found.present : 0 };
    });

    res.sendSuccess(fullStats);
  } catch (error) {
    res.sendError(error.message, 500);
  }
};

exports.getLateWorkers = async (req, res) => {
  try {
    const lateWorkers = await Attendance.aggregate([
      { $match: { status: 'late' } },
      { $group: { _id: '$employeeId', lateCount: { $sum: 1 } } },
      { $sort: { lateCount: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'employees', localField: '_id', foreignField: '_id', as: 'employee' } },
      { $unwind: '$employee' }
    ]);
    res.sendSuccess(lateWorkers);
  } catch (error) {
    res.sendError(error.message, 500);
  }
};

exports.getReliabilityScores = async (req, res) => {
  try {
    // Single aggregation for all employees at once
    const attendanceStats = await Attendance.aggregate([
      { $match: { status: { $in: ['late', 'absent'] } } },
      { $group: {
        _id: '$employeeId',
        lateCount: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
        absenceCount: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } }
      }}
    ]);

    const employees = await Employee.find({ status: 'active' });
    const scores = employees.map(emp => {
      const stats = attendanceStats.find(s => s._id.toString() === emp._id.toString()) || { lateCount: 0, absenceCount: 0 };
      const score = Math.max(0, 100 - (stats.lateCount * 2) - (stats.absenceCount * 5));
      return {
        id: emp._id,
        name: emp.name,
        department: emp.department,
        score
      };
    });

    res.sendSuccess(scores.sort((a, b) => b.score - a.score));
  } catch (error) {
    res.sendError(error.message, 500);
  }
};

exports.getAttendanceTrend = async (req, res) => {
  try {
    const last7DaysStrings = [];
    const last7DaysDates = [];
    for (let i = 6; i >= 0; i--) {
      const d = dayjs.utc().subtract(i, 'day').startOf('day');
      last7DaysStrings.push(d.format('YYYY-MM-DD'));
      last7DaysDates.push(d.toDate());
    }

    const trend = await Attendance.aggregate([
      { $match: { date: { $in: last7DaysDates } } },
      { $group: {
        _id: '$date',
        present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late', 'holiday_work']] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Fill gaps for days with no activity
    const data = last7DaysStrings.map(dateStr => {
      const dateObj = dayjs.utc(dateStr).toDate();
      const dayData = trend.find(t => dayjs(t._id).isSame(dayjs(dateObj), 'day'));
      return {
        date: dayjs.utc(dateStr).format('DD MMM'),
        present: dayData?.present || 0,
        absent: dayData?.absent || 0
      };
    });

    res.sendSuccess(data);
  } catch (error) {
    res.sendError(error.message, 500);
  }
};
