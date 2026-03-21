const express = require('express');
const router = express.Router();
const WorkSchedule = require('../models/WorkSchedule');
const { protect, authorize } = require('../middlewares/auth');
const logAction = require('../utils/auditLogger');
const emailService = require('../services/emailService');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

router.get('/', protect, authorize('admin', 'manager', 'supervisor'), async (req, res) => {
  try {
    const schedules = await WorkSchedule.find().populate('employeeId shiftId');
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

router.get('/my', protect, async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) return res.json([]);

    const today = dayjs.utc().startOf('day').toDate();
    const schedules = await WorkSchedule.find({ 
      employeeId,
      date: { $gte: today }
    }).populate('shiftId').sort({ date: 1 });
    
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { employeeId, date, shiftId, isWeekendShift, isHolidayShift, notes } = req.body;
    
    // Normalize date to UTC midnight (start of day)
    const normalizedDate = dayjs.utc(date).startOf('day').toDate();

    const schedule = await WorkSchedule.findOneAndUpdate(
      { employeeId, date: normalizedDate },
      { 
        employeeId, 
        shiftId, 
        date: normalizedDate, 
        isWeekendShift, 
        isHolidayShift, 
        notes 
      },
      { new: true, upsert: true, runValidators: true }
    );

    const isUpdate = schedule.createdAt.getTime() !== schedule.updatedAt.getTime();
    await logAction(req, isUpdate ? 'schedule_updated' : 'schedule_created', 'WorkSchedule', schedule._id, { employeeId: schedule.employeeId });
    
    // Send Email Notification
    try {
      const fullSchedule = await WorkSchedule.findById(schedule._id).populate('employeeId shiftId');
      if (fullSchedule && fullSchedule.employeeId) {
        await emailService.notifyWorkerNewSchedule(fullSchedule.employeeId, fullSchedule);
      }
    } catch (emailErr) {
      console.error('Failed to send schedule notification email:', emailErr.message);
    }

    res.status(201).json(schedule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const HolidayWorkRequest = require('../models/HolidayWorkRequest');
    const Holiday = require('../models/Holiday');
    const Employee = require('../models/Employee');

    const schedule = await WorkSchedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });

    // Synchronization: Reset any linked holiday work request
    await HolidayWorkRequest.updateMany(
      { workScheduleId: schedule._id },
      { status: 'pending', $unset: { workScheduleId: 1 } }
    );

    // Notify Worker (if it was a holiday shift)
    if (schedule.isHolidayShift) {
      try {
        const employee = await Employee.findById(schedule.employeeId);
        if (employee) {
          await emailService.notifyWorkerHolidayShiftCancelled(employee, schedule.date);
        }
      } catch (emailErr) {
        console.error('Failed to send cancellation email:', emailErr.message);
      }
    }

    await WorkSchedule.findByIdAndDelete(req.params.id);
    await logAction(req, 'schedule_deleted', 'WorkSchedule', req.params.id);
    res.json({ message: 'Schedule deleted and requests synchronized' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
