const cron = require('node-cron');
const dayjs = require('dayjs');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const CompanySettings = require('../models/CompanySettings');
dayjs.extend(utc);
dayjs.extend(timezone);

// Run every night at 23:55 Nairobi time (20:55 UTC) to mark absent workers
cron.schedule('55 20 * * 1-5', async () => {
  console.log("Running Daily Absence Check...");
  const settings = await CompanySettings.findOne();
  const companyTz = settings?.timezone || 'UTC';
  const today = dayjs().tz(companyTz).startOf('day').toDate();
  
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