const cron = require('node-cron');
const dayjs = require('dayjs');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const CompanySettings = require('../models/CompanySettings');
dayjs.extend(utc);
dayjs.extend(timezone);

// Run every day at 23:59 Nairobi time (20:59 UTC)
cron.schedule('59 20 * * *', async () => {
  console.log('Running Auto-Absence Job...');
  try {
    const settings = await CompanySettings.findOne();
    const companyTz = settings?.timezone || 'UTC';
    const now = dayjs().tz(companyTz);
    const today = now.format('YYYY-MM-DD');
    const { isWeekend, isHoliday } = require('../utils/dateUtils');
    const holidayToday = await isHoliday(now);
    const weekendToday = await isWeekend(now);
    const dayName = now.format('dddd');

    const employees = await Employee.find({ status: 'active' });

    for (const employee of employees) {
      // 1. Skip if it's their religious rest day
      if (employee.religiousRestDay === dayName) {
        console.log(`Skipping auto-absent for ${employee.name} (Religious Rest Day: ${dayName})`);
        continue;
      }

      // 2. Skip if it's a weekend and they aren't a weekend worker
      if (weekendToday && !employee.weekendWorker) {
        continue;
      }

      // 3. Skip if it's a holiday and they aren't a holiday worker
      if (holidayToday && !employee.holidayWorker) {
        continue;
      }

      const attendance = await Attendance.findOne({
        employeeId: employee._id,
        date: new Date(today)
      });

      if (!attendance) {
        await Attendance.create({
          employeeId: employee._id,
          shiftId: employee.shiftId,
          date: new Date(today),
          status: 'absent',
          signInMethod: 'manual'
        });
        console.log(`Marked ${employee.name} as absent for ${today}`);
      }
    }
    console.log('Auto-Absence Job completed.');
  } catch (error) {
    console.error('Error in Auto-Absence Job:', error);
  }
});
