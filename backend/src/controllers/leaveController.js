const LeaveRequest = require('../models/LeaveRequest');
const LeaveBalance = require('../models/LeaveBalance');
const calculateLeaveDays = require('../utils/calculateLeaveDays');
const { sendEmail, sendTemplate, sendLeaveApprovalEmail, notifyAdminLeaveRequest } = require('../services/emailService');
const dayjs = require('dayjs');
const logAction = require('../utils/auditLogger');

exports.applyLeave = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const request = await LeaveRequest.create({
      employeeId: req.user.employeeId,
      leaveType, startDate, endDate, reason
    });
    
    // Notify Admin
    await notifyAdminLeaveRequest(req.user, request);

    res.sendSuccess(request, 'Leave request submitted', 201);
    await logAction(req, 'leave_applied', 'LeaveRequest', request._id, { type: leaveType });
  } catch (err) { next(err); }
};

exports.approveLeave = async (req, res, next) => {
  try {
    const { id } = req.params;
    const leave = await LeaveRequest.findById(id).populate('employeeId');
    if (!leave) return res.sendError('Leave not found', 404);

    const workingDays = await calculateLeaveDays(leave.startDate, leave.endDate);
    
    const balance = await LeaveBalance.findOne({ employeeId: leave.employeeId._id, year: new Date().getFullYear() });
    if (balance.remainingLeave < workingDays && leave.leaveType === 'annual') {
      return res.sendError('Insufficient leave balance', 400);
    }

    leave.status = 'approved';
    leave.approvedBy = req.user.id;
    await leave.save();

    if (leave.leaveType === 'annual') {
      balance.annualLeaveUsed += workingDays;
      balance.remainingLeave -= workingDays;
      await balance.save();
    }

    await sendLeaveApprovalEmail(leave.employeeId.email, leave.employeeId.name, dayjs(leave.startDate).format('DD MMM'), dayjs(leave.endDate).format('DD MMM'), 'approved');
    await logAction(req, 'leave_approved', 'LeaveRequest', leave._id, { days: workingDays });
    res.sendSuccess(leave, 'Leave approved');
  } catch (err) { next(err); }
};

exports.rejectLeave = async (req, res, next) => {
  try {
    const { id } = req.params;
    const leave = await LeaveRequest.findById(id).populate('employeeId');
    if (!leave) return res.sendError('Leave not found', 404);

    leave.status = 'rejected';
    leave.rejectedBy = req.user.id;
    await leave.save();

    await sendLeaveApprovalEmail(leave.employeeId.email, leave.employeeId.name, dayjs(leave.startDate).format('DD MMM'), dayjs(leave.endDate).format('DD MMM'), 'rejected');
    await logAction(req, 'leave_rejected', 'LeaveRequest', leave._id);
    res.sendSuccess(leave, 'Leave rejected');
  } catch (err) { next(err); }
};

exports.getLeaves = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' || req.user.role === 'manager' ? {} : { employeeId: req.user.employeeId };
    const leaves = await LeaveRequest.find(query).populate('employeeId', 'name employeeId department');
    res.sendSuccess(leaves);
  } catch (err) { next(err); }
};

exports.createLeave = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const leave = await LeaveRequest.create({
      employeeId: req.user.employeeId,
      leaveType,
      startDate,
      endDate,
      reason
    });
    res.sendSuccess(leave, 'Leave created', 201);
  } catch (err) { next(err); }
};

exports.getLeaveBalance = async (req, res, next) => {
  try {
    const balance = await LeaveBalance.findOne({ employeeId: req.user.employeeId, year: new Date().getFullYear() });
    res.json(balance || { remainingLeave: 12, annualLeaveUsed: 0 }); // Fallback for demo
  } catch (err) { next(err); }
};