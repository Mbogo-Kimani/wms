const mongoose = require('mongoose');

const workScheduleSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  shiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true },
  date: { type: Date, required: true },
  isWeekendShift: { type: Boolean, default: false },
  isHolidayShift: { type: Boolean, default: false },
  notes: { type: String }
}, { timestamps: true });

workScheduleSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('WorkSchedule', workScheduleSchema);
