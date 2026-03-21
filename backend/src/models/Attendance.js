const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  shiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true },
  date: { type: Date, required: true }, // Normalize to YYYY-MM-DD
  signInTime: { type: Date },
  signOutTime: { type: Date },
  signInLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },
  signOutLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },
  signInMethod: { type: String, enum: ['mobile', 'web', 'manual', 'kiosk'], default: 'mobile' },
  signOutMethod: { type: String, enum: ['mobile', 'web', 'manual', 'kiosk', 'system'] },
  isHolidayWork: { type: Boolean, default: false },
  isWeekendWork: { type: Boolean, default: false },
  religiousOverride: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['present', 'late', 'absent', 'on_leave', 'half_day', 'holiday_work', 'weekend_work', 'religious_day_off', 'overtime'], 
    default: 'present' 
  },
  lateSignInMinutes: { type: Number, default: 0 },
  overtimeMinutes: { type: Number, default: 0 }
}, { timestamps: true });

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);