const mongoose = require('mongoose');

const holidayWorkRequestSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  holidayId: { type: mongoose.Schema.Types.ObjectId, ref: 'Holiday', required: true },
  reason: { type: String, default: 'Interested in working on this holiday' },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
  workScheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkSchedule' }
}, { timestamps: true });

// Prevent duplicate requests from the same employee for the same holiday
holidayWorkRequestSchema.index({ employeeId: 1, holidayId: 1 }, { unique: true });

module.exports = mongoose.model('HolidayWorkRequest', holidayWorkRequestSchema);
