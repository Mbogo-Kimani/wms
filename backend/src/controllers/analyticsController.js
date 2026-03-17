const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const dayjs = require('dayjs');

exports.getAttendanceOverview = async (req, res) => {
  try {
    const today = dayjs().startOf('day').toDate();
    const totalEmployees = await Employee.countDocuments({ status: 'active' });
    
    const presentCount = await Attendance.countDocuments({ date: today, status: { $in: ['present', 'holiday_work'] } });
    const lateCount = await Attendance.countDocuments({ date: today, status: 'late' });
    const absentCount = await Attendance.countDocuments({ date: today, status: 'absent' });
    const leaveCount = await Attendance.countDocuments({ date: today, status: 'on_leave' });

    res.sendSuccess({
      attendanceRate: totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0,
      lateRate: presentCount > 0 ? Math.round((lateCount / presentCount) * 100) : 0,
      absenceRate: totalEmployees > 0 ? Math.round((absentCount / totalEmployees) * 100) : 0,
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
    const today = dayjs().startOf('day').toDate();
    const stats = await Attendance.aggregate([
      { $match: { date: today } },
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
    // Basic scoring algorithm
    const employees = await Employee.find({ status: 'active' });
    const scores = [];

    for (const emp of employees) {
      const lateCount = await Attendance.countDocuments({ employeeId: emp._id, status: 'late' });
      const absenceCount = await Attendance.countDocuments({ employeeId: emp._id, status: 'absent' });
      
      const score = Math.max(0, 100 - (lateCount * 2) - (absenceCount * 5));
      scores.push({
        id: emp._id,
        name: emp.name,
        department: emp.department,
        score
      });
    }

    res.sendSuccess(scores.sort((a, b) => b.score - a.score));
  } catch (error) {
    res.sendError(error.message, 500);
  }
};
