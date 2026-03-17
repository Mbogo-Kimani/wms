const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Morning Shift"
  startTime: { type: String, required: true }, // e.g., "08:00"
  endTime: { type: String, required: true },   // e.g., "17:00"
  location: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    radius: { type: Number, default: 500 } // Accuracy radius in meters
  },
  days: [{ type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }],
  gracePeriodMinutes: { type: Number, default: 15 },
  lateAfterMinutes: { type: Number, default: 30 },
  overtimeAfterMinutes: { type: Number, default: 60 }
}, { timestamps: true });

module.exports = mongoose.model('Shift', shiftSchema);