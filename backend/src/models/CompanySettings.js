const mongoose = require('mongoose');

const companySettingsSchema = new mongoose.Schema({
  companyName: { type: String, default: 'WMS Industrial' },
  latitude: { type: Number, default: 0 },
  longitude: { type: Number, default: 0 },
  allowedRadiusMeters: { type: Number, default: 1000 },
  allowedWifiSSID: { type: String, default: 'Company_Guest' },
  weekendDays: { 
    type: [String], 
    default: ['Saturday', 'Sunday'],
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  timezone: { type: String, default: 'UTC' }
}, { timestamps: true });

module.exports = mongoose.model('CompanySettings', companySettingsSchema);