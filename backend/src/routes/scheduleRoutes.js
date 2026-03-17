const express = require('express');
const router = express.Router();
const WorkSchedule = require('../models/WorkSchedule');
const { protect, authorize } = require('../middlewares/auth');
const logAction = require('../utils/auditLogger');

router.use(protect, authorize('admin', 'manager'));

router.get('/', async (req, res) => {
  try {
    const schedules = await WorkSchedule.find().populate('employeeId shiftId');
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const schedule = await WorkSchedule.create(req.body);
    await logAction(req, 'schedule_created', 'WorkSchedule', schedule._id, { employeeId: schedule.employeeId });
    res.status(201).json(schedule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await WorkSchedule.findByIdAndDelete(req.params.id);
    await logAction(req, 'schedule_deleted', 'WorkSchedule', req.params.id);
    res.json({ message: 'Schedule deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
