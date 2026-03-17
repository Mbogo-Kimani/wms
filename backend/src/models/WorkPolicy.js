const mongoose = require('mongoose');

const workPolicySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  regularLoginStart: { type: String, default: '06:00' }, // HH:mm
  regularLoginEnd: { type: String, default: '09:30' },
  holidayLoginStart: { type: String, default: '07:00' },
  holidayLoginEnd: { type: String, default: '10:00' },
  weekendLoginStart: { type: String, default: '07:00' },
  weekendLoginEnd: { type: String, default: '09:30' },
  gracePeriodMinutes: { type: Number, default: 15 },
  lateAfterMinutes: { type: Number, default: 30 },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('WorkPolicy', workPolicySchema);
