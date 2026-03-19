const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const dayjs = require('dayjs');

exports.getAttendanceOverview = async (req, res) => {
  try {
    const today = dayjs().format('YYYY-MM-DD');
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const todayDate = new Date(today);
    const yesterdayDate = new Date(yesterday);

    const totalEmployees = await Employee.countDocuments({ status: 'active' });
    
    // Include calendar today + active sessions from yesterday (night shifts)
    const stats = await Attendance.aggregate([
      { $match: { 
        $or: [
          { date: todayDate },
          { date: yesterdayDate, signOutTime: { $exists: false } }
        ]
      }},
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);

    const getCount = (statusArr) => {
      if (Array.isArray(statusArr)) {
        return stats.filter(s => statusArr.includes(s._id)).reduce((acc, curr) => acc + curr.count, 0);
      }
      return stats.find(s => s._id === statusArr)?.count || 0;
    };

    const presentCount = getCount(['present', 'late', 'holiday_work']);
    const lateCount = getCount('late');
    const absentCount = getCount('absent');
    const leaveCount = getCount('on_leave');

    // Calculate YESTERDAY's stats for trend
    const yesterdayStats = await Attendance.aggregate([
      { $match: { date: yesterdayDate } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const getYesterdayCount = (statusArr) => {
        if (Array.isArray(statusArr)) {
            return yesterdayStats.filter(s => statusArr.includes(s._id)).reduce((acc, curr) => acc + curr.count, 0);
        }
        return yesterdayStats.find(s => s._id === statusArr)?.count || 0;
    };

    const yPresent = getYesterdayCount(['present', 'late', 'holiday_work']);
    const yLate = getYesterdayCount('late');
    const yAbsent = getYesterdayCount('absent');

    const calculateTrend = (current, previous) => {
        if (!previous || previous === 0) return { value: '0%', isUp: true };
        const diff = ((current - previous) / previous) * 100;
        return {
            value: `${Math.abs(Math.round(diff * 10) / 10)}%`,
            isUp: diff >= 0
        };
    };

    // Calculate Average Reliability
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
      attendanceRate: totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0,
      lateRate: presentCount > 0 ? Math.round((lateCount / presentCount) * 100) : 0,
      absenceRate: totalEmployees > 0 ? Math.round((absentCount / totalEmployees) * 100) : 0,
      avgReliability,
      trends: {
        attendance: calculateTrend(presentCount, yPresent),
        late: calculateTrend(lateCount, yLate),
        absence: calculateTrend(absentCount, yAbsent),
        reliability: { value: '0%', isUp: true } // Simplified for now
      },
      details: { present: presentCount, late: lateCount, absent: absentCount, onLeave: leaveCount, total: totalEmployees }
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
    const today = dayjs().format('YYYY-MM-DD');
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const todayDate = new Date(today);
    const yesterdayDate = new Date(yesterday);

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
    res.sendSuccess(stats);
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
      const d = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      last7DaysStrings.push(d);
      last7DaysDates.push(new Date(d));
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
      const dateObj = new Date(dateStr);
      const dayData = trend.find(t => t._id.getTime() === dateObj.getTime());
      return {
        date: dayjs(dateStr).format('DD MMM'),
        present: dayData?.present || 0,
        absent: dayData?.absent || 0
      };
    });

    res.sendSuccess(data);
  } catch (error) {
    res.sendError(error.message, 500);
  }
};
