const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  type: { 
    type: String, 
    enum: ['national', 'religious', 'company'], 
    default: 'national',
    required: true 
  },
  country: { type: String, default: 'Kenya' }, // Default country for multi-branch support
  description: { type: String },
  isRecurring: { type: Boolean, default: true },
}, { timestamps: true });

holidaySchema.index({ date: 1, country: 1 });

module.exports = mongoose.model('Holiday', holidaySchema);
