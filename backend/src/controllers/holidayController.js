const Holiday = require('../models/Holiday');
const logAction = require('../utils/auditLogger');
const dayjs = require('dayjs');

exports.getHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.sendSuccess(holidays);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.createHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.create(req.body);
    await logAction(req, 'holiday_created', 'Holiday', holiday._id, { name: holiday.name });
    res.sendSuccess(holiday, 'Holiday created', 201);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await logAction(req, 'holiday_updated', 'Holiday', holiday._id, { name: holiday.name });
    res.sendSuccess(holiday, 'Holiday updated');
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteHoliday = async (req, res) => {
  try {
    await Holiday.findByIdAndDelete(req.params.id);
    await logAction(req, 'holiday_deleted', 'Holiday', req.params.id);
    res.sendSuccess(null, 'Holiday deleted');
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getUpcomingHolidays = async (req, res) => {
  try {
    const today = dayjs().startOf('day').toDate();
    const holidays = await Holiday.find({ date: { $gte: today } })
      .sort({ date: 1 })
      .limit(5);
    res.sendSuccess(holidays);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};
