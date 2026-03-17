const cron = require('node-cron');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const dayjs = require('dayjs');

// Run every night at 23:55 to mark absent workers
cron.schedule('55 23 * * 1-5', async () => {
  console.log("Running Daily Absence Check...");
  const today = dayjs().startOf('day').toDate();
  
  // Find all active employees who didn't clock in today
  const employees = await Employee.find({ status: 'active' });
  for (let emp of employees) {
    const record = await Attendance.findOne({ employeeId: emp._id, date: today });
    if (!record) {
      await Attendance.create({
        employeeId: emp._id,
        shiftId: emp.shiftId,
        date: today,
        status: 'absent'
      });
    }
  }
});