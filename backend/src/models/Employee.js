const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  phone: { type: String, default: '' },
  department: { type: String, required: true },
  position: { type: String, required: true },
  dateHired: { type: Date, required: true },
  status: { type: String, enum: ['active', 'inactive', 'on_leave'], default: 'active' },
  shiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Linked auth account
  profilePhoto: { type: String },
  biometricId: { type: String }, // Future Integration
  religion: { type: String },
  religiousRestDay: { 
    type: String, 
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'None'],
    default: 'None'
  },
  weekendWorker: { type: Boolean, default: false },
  holidayWorker: { type: Boolean, default: false },
  workPolicy: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkPolicy' }
}, { timestamps: true });

employeeSchema.pre('save', async function(next) {
  if (!this.employeeId) {
    const lastEmployee = await mongoose.model('Employee')
      .findOne({}, { employeeId: 1 })
      .sort({ createdAt: -1 }); // Using createdAt or employeeId sort as a fallback

    let nextNumber = 1;
    if (lastEmployee && lastEmployee.employeeId) {
      const match = lastEmployee.employeeId.match(/\d+/);
      if (match) {
        nextNumber = parseInt(match[0]) + 1;
      }
    }
    
    // Ensure we don't collision if there were gaps
    let isDuplicate = true;
    while (isDuplicate) {
      this.employeeId = `EMP-${nextNumber.toString().padStart(4, '0')}`;
      const existing = await mongoose.model('Employee').findOne({ employeeId: this.employeeId });
      if (!existing) {
        isDuplicate = false;
      } else {
        nextNumber++;
      }
    }
  }
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);