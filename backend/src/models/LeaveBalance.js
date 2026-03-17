const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  year: { type: Number, required: true },
  annualLeaveTotal: { type: Number, default: 20 },
  annualLeaveUsed: { type: Number, default: 0 },
  sickLeaveUsed: { type: Number, default: 0 },
  remainingLeave: { type: Number, default: 20 }
});
module.exports = mongoose.model('LeaveBalance', schema);