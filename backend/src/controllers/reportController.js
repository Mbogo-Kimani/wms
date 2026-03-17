const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Shift = require('../models/Shift');
const LeaveRequest = require('../models/LeaveRequest');
const dayjs = require('dayjs');

exports.getAttendanceReport = async (req, res, next) => {
  try {
    const { startDate, endDate, department } = req.query;
    
    let query = {};
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    if (department) {
      const employees = await Employee.find({ department });
      const employeeIds = employees.map(emp => emp._id);
      query.employeeId = { $in: employeeIds };
    }

    const report = await Attendance.find(query)
      .populate('employeeId', 'name employeeId department')
      .populate('shiftId', 'name startTime endTime')
      .sort({ date: -1 });

    res.sendSuccess(report);
  } catch (err) { next(err); }
};

exports.getDailyAttendance = async (req, res) => {
  try {
    const date = req.query.date ? dayjs(req.query.date).startOf('day').toDate() : dayjs().startOf('day').toDate();
    
    const stats = await Attendance.aggregate([
      { $match: { date } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);

    const totalEmployees = await Employee.countDocuments({ status: 'active' });
    const presentCount = stats.find(s => s._id === 'present')?.count || 0;
    const lateCount = stats.find(s => s._id === 'late')?.count || 0;
    const absentCount = stats.find(s => s._id === 'absent')?.count || 0;
    
    res.sendSuccess({
        total: totalEmployees,
        present: presentCount + lateCount,
        late: lateCount,
        absent: absentCount,
        onLeave: totalEmployees - (presentCount + lateCount + absentCount)
    });
  } catch (error) {
    res.sendError(error.message, 500);
  }
};

exports.getShiftSummary = async (req, res) => {
  try {
    const summary = await Attendance.aggregate([
      { $lookup: {
        from: 'shifts',
        localField: 'shiftId',
        foreignField: '_id',
        as: 'shift'
      }},
      { $unwind: '$shift' },
      { $group: {
        late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } }
      }}
    ]);
    res.sendSuccess(summary);
  } catch (error) {
    res.sendError(error.message, 500);
  }
};

exports.getLeaveSummary = async (req, res) => {
  try {
    const summary = await LeaveRequest.aggregate([
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};