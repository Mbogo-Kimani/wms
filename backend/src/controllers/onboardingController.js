const User = require('../models/User');
const Employee = require('../models/Employee');
const LeaveBalance = require('../models/LeaveBalance');
const AuditLog = require('../models/AuditLog');
const emailService = require('../services/emailService');

exports.getPendingRegistrations = async (req, res, next) => {
  try {
    const pending = await User.find({ accountStatus: 'pending' }).select('-password');
    res.sendSuccess(pending);
  } catch (err) { next(err); }
};

exports.verifyWorker = async (req, res, next) => {
  try {
    const { userId, role, department, position, shiftId, annualLeave, sickLeave, phoneNumber, profilePhoto } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.sendError('User not found', 404);

    // 1. Create Employee Profile (Check for duplicates first)
    let employee = await Employee.findOne({ userId: user._id });
    
    if (!employee) {
      employee = await Employee.create({
        userId: user._id,
        name: user.name,
        email: user.email,
        phone: phoneNumber,
        department,
        position,
        dateHired: new Date(),
        shiftId,
        status: 'active',
        religion: user.religion,
        religiousRestDay: user.religiousRestDay,
        profilePhoto
      });
    }

    // 2. Update User
    user.accountStatus = 'verified';
    user.role = role;
    user.employeeId = employee._id;
    await user.save();

    // 3. Create Leave Balance (Check for duplicates first)
    const existingBalance = await LeaveBalance.findOne({ 
      employeeId: employee._id, 
      year: new Date().getFullYear() 
    });

    if (!existingBalance) {
      await LeaveBalance.create({
        employeeId: employee._id,
        year: new Date().getFullYear(),
        annualLeaveTotal: annualLeave,
        remainingLeave: annualLeave,
        annualLeaveUsed: 0
      });
    }

    // 4. Audit Log (Fix validation fields)
    await AuditLog.create({
      userId: req.user._id,
      action: 'ADMIN_VERIFIED_WORKER',
      details: `Verified worker: ${user.name} (${user.email}). Assigned role: ${role}`,
      entityId: user._id,
      entityType: 'User'
    });

    // 5. Notify Worker
    try {
      await emailService.notifyWorkerVerified(user);
    } catch (emailErr) {
      console.error('Email Notification Failed:', emailErr.message);
    }

    res.sendSuccess(employee, 'Worker verified and profile created successfully');
  } catch (err) { next(err); }
};

exports.rejectWorker = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 1. Notify Worker
    try {
      await emailService.notifyWorkerRejected(user);
    } catch (emailErr) {
      console.error('Email Notification Failed:', emailErr.message);
    }

    // 2. Delete User
    await User.findByIdAndDelete(userId);

    // 3. Audit Log
    await AuditLog.create({
      user: req.user._id,
      action: 'ADMIN_REJECTED_WORKER',
      details: `Rejected registration for: ${user.name} (${user.email})`,
      targetId: userId,
      targetModel: 'User'
    });

    res.sendSuccess(null, 'Worker registration rejected and account removed');
  } catch (err) { next(err); }
};
