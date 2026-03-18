const cron = require('node-cron');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const dayjs = require('dayjs');

// Run every day at 11:59 PM
cron.schedule('59 23 * * *', async () => {
  console.log('Running Auto-Absence Job...');
  try {
    const today = dayjs().format('YYYY-MM-DD');
    const { isWeekend, isHoliday } = require('../utils/dateUtils');
    const holidayToday = await isHoliday(today);
    const weekendToday = await isWeekend(today);
    const dayName = dayjs(today).format('dddd');

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
        date: today
      });

      if (!attendance) {
        await Attendance.create({
          employeeId: employee._id,
          shiftId: employee.shiftId,
          date: today,
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
