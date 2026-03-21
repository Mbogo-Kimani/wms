const HolidayWorkRequest = require('../models/HolidayWorkRequest');
const Holiday = require('../models/Holiday');
const Employee = require('../models/Employee');
const WorkSchedule = require('../models/WorkSchedule');
const emailService = require('../services/emailService');
const logAction = require('../utils/auditLogger');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

exports.createRequest = async (req, res) => {
  try {
    const { holidayId, reason } = req.body;
    const employeeId = req.user.employeeId;

    if (!employeeId) {
      return res.status(400).json({ error: 'No employee profile associated with this account' });
    }

    const request = await HolidayWorkRequest.create({
      employeeId,
      holidayId,
      reason
    });

    // Send Email to Admin
    try {
      const employee = await Employee.findById(employeeId);
      const holiday = await Holiday.findById(holidayId);
      if (employee && holiday) {
        await emailService.notifyAdminHolidayRequest(employee, holiday);
      }
    } catch (emailErr) {
      console.error('Failed to send admin holiday request notification:', emailErr.message);
    }

    await logAction(req, 'holiday_work_request_created', 'HolidayWorkRequest', request._id, { holidayId });
    res.status(201).json(request);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'You have already submitted a request for this holiday' });
    }
    res.status(400).json({ error: error.message });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const requests = await HolidayWorkRequest.find({ employeeId: req.user.employeeId })
      .populate('holidayId')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const requests = await HolidayWorkRequest.find()
      .populate('employeeId holidayId')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.resolveRequest = async (req, res) => {
  try {
    const { status, shiftId } = req.body;
    const request = await HolidayWorkRequest.findById(req.params.id).populate('holidayId');

    if (!request) return res.status(404).json({ error: 'Request not found' });

    request.status = status;
    request.resolvedBy = req.user._id;
    request.resolvedAt = new Date();
    await request.save();

    // Send Email to Worker
    const employee = await Employee.findById(request.employeeId);
    try {
      if (employee) {
        await emailService.notifyWorkerHolidayRequestResolved(employee, request.holidayId, status);
      }
    } catch (emailErr) {
      console.error('Failed to send worker holiday request resolution email:', emailErr.message);
    }

    // If approved, create a WorkSchedule override
    if (status === 'approved') {
      const normalizedDate = dayjs.utc(request.holidayId.date).startOf('day').toDate();
      
      // Use provided shiftId or fall back to employee default
      const finalShiftId = shiftId || employee?.shiftId;

      const schedule = await WorkSchedule.findOneAndUpdate(
        { employeeId: request.employeeId, date: normalizedDate },
        { 
          employeeId: request.employeeId, 
          date: normalizedDate, 
          shiftId: finalShiftId,
          isHolidayShift: true,
          notes: `Interest expressed via Holiday Work Request: ${request.reason}`
        },
        { upsert: true, new: true }
      );

      request.workScheduleId = schedule._id;
      await request.save();

      // Trigger automatic schedule notification
      try {
        const fullSchedule = await WorkSchedule.findById(schedule._id).populate('employeeId shiftId');
        if (fullSchedule && fullSchedule.employeeId) {
          await emailService.notifyWorkerNewSchedule(fullSchedule.employeeId, fullSchedule);
        }
      } catch (emailErr) {
        console.error('Failed to send schedule notification after holiday approval:', emailErr.message);
      }
    }

    await logAction(req, `holiday_work_request_${status}`, 'HolidayWorkRequest', request._id);
    res.json(request);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.unscheduleRequest = async (req, res) => {
  try {
    const request = await HolidayWorkRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    if (request.workScheduleId) {
      const result = await WorkSchedule.findByIdAndDelete(request.workScheduleId);
      if (result) deletedCount++;
    }

    // Fallback: Delete via Date/Employee if explicit ID failed or was missing
    // This is useful for older records or if the sync was interrupted
    if (deletedCount === 0) {
      const holiday = await Holiday.findById(request.holidayId);
      if (holiday) {
        const normalizedDate = dayjs.utc(holiday.date).startOf('day').toDate();
        const result = await WorkSchedule.findOneAndDelete({
          employeeId: request.employeeId,
          date: normalizedDate
        });
        if (result) {
          deletedCount++;
        }
      }
    }

    // Identify holiday for notification
    const holiday = await Holiday.findById(request.holidayId);
    
    // Revert status
    request.status = 'pending';
    request.workScheduleId = undefined;
    await request.save();

    // Notify Worker
    if (deletedCount > 0) {
      try {
        const employee = await Employee.findById(request.employeeId);
        if (employee && holiday) {
          await emailService.notifyWorkerHolidayShiftCancelled(employee, holiday.date);
        } else {
          console.warn('Could not send cancellation email: missing employee or holiday profile');
        }
      } catch (emailErr) {
        console.error('Failed to send cancellation email:', emailErr.message);
      }
    }

    await logAction(req, 'holiday_work_request_unscheduled', 'HolidayWorkRequest', request._id);
    res.json({ ...request.toObject(), deletedScheduleCount: deletedCount });
  } catch (error) {
    console.error('Unschedule error:', error);
    res.status(400).json({ error: error.message });
  }
};
