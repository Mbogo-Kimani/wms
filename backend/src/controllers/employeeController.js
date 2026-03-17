const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');

exports.getEmployees = async (req, res, next) => {
  try {
    const employees = await Employee.find().populate('shiftId').populate('workPolicy');
    res.sendSuccess(employees);
  } catch (err) { next(err); }
};

exports.getEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    let employee;

    if (mongoose.Types.ObjectId.isValid(id)) {
      employee = await Employee.findById(id).populate('shiftId').populate('workPolicy');
    } else {
      employee = await Employee.findOne({ employeeId: id }).populate('shiftId').populate('workPolicy');
    }

    if (!employee) {
      return res.sendError('Employee not found', 404);
    }

    // Add Reliability stats
    const lateCount = await Attendance.countDocuments({ employeeId: employee._id, status: 'late' });
    const absenceCount = await Attendance.countDocuments({ employeeId: employee._id, status: 'absent' });
    const presentCount = await Attendance.countDocuments({ employeeId: employee._id, status: { $in: ['present', 'late', 'holiday_work'] } });
    
    const reliabilityScore = Math.max(0, 100 - (lateCount * 2) - (absenceCount * 5));

    const stats = {
      lateCount,
      absenceCount,
      presentCount,
      reliabilityScore,
      totalRecords: await Attendance.countDocuments({ employeeId: employee._id })
    };

    res.sendSuccess({ employee, stats });
  } catch (err) { next(err); }
};

const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.createEmployee = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { name, email, password, department, position, shiftId, dateHired, phone, religion, religiousRestDay, weekendWorker, holidayWorker } = req.body;

    // 1. Create User account
    const user = new User({
      name,
      email,
      password: password || 'Wms@2026',
      role: 'worker',
      accountStatus: 'verified' // Direct verification
    });
    await user.save({ session });

    // 2. Create Employee profile
    const employee = new Employee({
      name,
      email,
      phone,
      department,
      position,
      dateHired: dateHired || new Date(),
      shiftId,
      userId: user._id,
      religion,
      religiousRestDay,
      weekendWorker,
      holidayWorker,
      status: 'active'
    });
    await employee.save({ session });

    // 3. Link Employee back to User
    user.employeeId = employee._id;
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.sendSuccess(employee, 'Staff member registered successfully with active account', 201);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

exports.updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!employee) return res.sendError('Employee not found', 404);
    res.sendSuccess(employee, 'Employee updated');
  } catch (err) { next(err); }
};

exports.deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.sendError('Employee not found', 404);
    res.sendSuccess(null, 'Employee deleted');
  } catch (err) { next(err); }
};

exports.getEmployeeActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') return res.sendError('Invalid Employee ID', 400);
    
    // Resolve employee _id if human-readable ID (EMP-XXXX) is provided
    let targetEmployeeId = id;
    if (id.startsWith('EMP')) {
      const emp = await Employee.findOne({ employeeId: id });
      if (!emp) return res.sendError('Employee not found', 404);
      targetEmployeeId = emp._id;
    }

    const attendance = await Attendance.find({ employeeId: targetEmployeeId }).sort({ date: -1 }).limit(10);
    const leaves = await LeaveRequest.find({ employeeId: targetEmployeeId }).sort({ createdAt: -1 }).limit(10);
    
    const timeline = [
      ...attendance.map(a => ({ type: 'attendance', date: a.date, status: a.status, time: a.signInTime })),
      ...leaves.map(l => ({ type: 'leave', date: l.startDate, status: l.status, leaveType: l.leaveType }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.sendSuccess(timeline);
  } catch (err) { next(err); }
};