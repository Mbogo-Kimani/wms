const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  department: { type: String, default: 'all' },
  priority: { type: String, enum: ['normal', 'high', 'urgent'], default: 'normal' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
module.exports = mongoose.model('Memo', schema);