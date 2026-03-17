const Shift = require('../models/Shift');

exports.getShifts = async (req, res, next) => {
  try {
    const shifts = await Shift.find();
    res.sendSuccess(shifts);
  } catch (err) { next(err); }
};

exports.createShift = async (req, res, next) => {
  try {
    const shift = await Shift.create(req.body);
    res.sendSuccess(shift, 'Shift created', 201);
  } catch (err) { next(err); }
};

exports.updateShift = async (req, res, next) => {
  try {
    const shift = await Shift.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!shift) return res.sendError('Shift not found', 404);
    res.sendSuccess(shift, 'Shift updated');
  } catch (err) { next(err); }
};

exports.deleteShift = async (req, res, next) => {
  try {
    const shift = await Shift.findByIdAndDelete(req.params.id);
    if (!shift) return res.sendError('Shift not found', 404);
    res.sendSuccess(null, 'Shift deleted');
  } catch (err) { next(err); }
};
