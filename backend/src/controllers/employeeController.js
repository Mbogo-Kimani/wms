const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const LeaveBalance = require('../models/LeaveBalance');

exports.getEmployees = async (req, res, next) => {
  try {
    const employees = await Employee.find().populate('shiftId').populate('workPolicy').populate('userId', 'role');
    res.sendSuccess(employees);
  } catch (err) { next(err); }
};

exports.getEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    let employee;

    if (mongoose.Types.ObjectId.isValid(id)) {
      employee = await Employee.findById(id).populate('shiftId').populate('workPolicy').populate('userId', 'role');
    } else {
      employee = await Employee.findOne({ employeeId: id }).populate('shiftId').populate('workPolicy').populate('userId', 'role');
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

    const balance = await LeaveBalance.findOne({ employeeId: employee._id, year: new Date().getFullYear() });

    res.sendSuccess({ employee, stats, balance });
  } catch (err) { next(err); }
};

const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.createEmployee = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let { name, email, password, department, position, shiftId, dateHired, phone, religion, religiousRestDay, weekendWorker, holidayWorker } = req.body;
    email = email.toLowerCase().trim();
    
    // Check for existing User to prevent E11000 duplicate key error
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
        const existingEmployee = await Employee.findOne({ userId: existingUser._id }).session(session);
        if (existingEmployee) {
            await session.abortTransaction();
            session.endSession();
            return res.sendError('An employee profile already exists for this email address.', 400);
        }
        
        if (existingUser.accountStatus === 'pending') {
            await session.abortTransaction();
            session.endSession();
            return res.sendError('This user has a pending registration. Please approve them in the "Pending Registrations" section instead.', 400);
        }

        // If it's a verified orphan (no profile), clean it up within the transaction
        await User.findByIdAndDelete(existingUser._id).session(session);
    }

    // 1. Create User account (Determine role from position)
    let role = 'worker';
    if (position === 'Supervisor') role = 'supervisor';
    if (position === 'Manager') role = 'manager';

    const user = new User({
      name,
      email,
      password: (password && password.trim() !== "") ? password : 'Wms@2026',
      role,
      accountStatus: 'verified' // Direct verification
    });
    await user.save({ session });

    // 2. Create Employee profile
    const employee = new Employee({
      name,
      email,
      phone: phone || '',
      department,
      position,
      dateHired: dateHired || new Date(),
      shiftId,
      userId: user._id,
      religion: religion || '',
      religiousRestDay: religiousRestDay || 'None',
      weekendWorker: weekendWorker || false,
      holidayWorker: holidayWorker || false,
      status: 'active'
    });
    await employee.save({ session });

    // 2b. Initialize Leave Balance
    const leaveBalance = new LeaveBalance({
      employeeId: employee._id,
      year: new Date().getFullYear(),
      annualLeaveTotal: 20,
      annualLeaveUsed: 0,
      sickLeaveUsed: 0,
      remainingLeave: 20
    });
    await leaveBalance.save({ session });

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
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('shiftId')
      .populate('workPolicy')
      .populate('userId', 'role');
    if (!employee) return res.sendError('Employee not found', 404);
    res.sendSuccess(employee, 'Employee updated');
  } catch (err) { next(err); }
};

exports.deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.sendError('Employee not found', 404);

    // 1. Delete associated User if exists (By ID and Email as fallback)
    if (employee.userId) {
      await User.findByIdAndDelete(employee.userId);
    }
    // Also delete by email to catch orphans with broken ID links
    await User.findOneAndDelete({ email: employee.email });

    // 2. Delete Leave Balances
    await LeaveBalance.deleteMany({ employeeId: employee._id });

    // 3. Delete Attendance records
    await Attendance.deleteMany({ employeeId: employee._id });
    
    // 3b. Delete Leave requests
    await LeaveRequest.deleteMany({ employeeId: employee._id });

    // 4. Delete Employee profile
    await Employee.findByIdAndDelete(req.params.id);

    res.sendSuccess(null, 'Employee and all associated data deleted successfully');
  } catch (err) {
    next(err);
  }
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