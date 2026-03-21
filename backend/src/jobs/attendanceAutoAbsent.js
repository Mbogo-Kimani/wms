const cron = require('node-cron');
const dayjs = require('dayjs');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const CompanySettings = require('../models/CompanySettings');
dayjs.extend(utc);
dayjs.extend(timezone);

// Run every day at 06:00 AM Nairobi time (03:00 UTC)
cron.schedule('0 3 * * *', async () => {
  console.log('Running Auto-Absence Job (Processing Yesterday)...');
  try {
    const settings = await CompanySettings.findOne();
    const companyTz = settings?.timezone || 'UTC';
    const now = dayjs().tz(companyTz);
    const yesterday = now.subtract(1, 'day');
    const targetDateStr = yesterday.format('YYYY-MM-DD');
    const { isWeekend, isHoliday } = require('../utils/dateUtils');
    const holidayOnTarget = await isHoliday(yesterday);
    const weekendOnTarget = await isWeekend(yesterday);
    const dayNameOnTarget = yesterday.format('dddd');

    const employees = await Employee.find({ status: 'active' });

    for (const employee of employees) {
      const WorkSchedule = require('../models/WorkSchedule');
      const targetMidnight = dayjs.utc(targetDateStr).toDate();
      const schedule = await WorkSchedule.findOne({ employeeId: employee._id, date: targetMidnight });

      const isWeekendOverride = schedule?.isWeekendShift;
      const isHolidayOverride = schedule?.isHolidayShift;

      // 1. Skip if it's their religious rest day
      if (employee.religiousRestDay === dayNameOnTarget) {
        console.log(`Skipping auto-absent for ${employee.name} (Religious Rest Day: ${dayNameOnTarget})`);
        continue;
      }

      // 2. Skip if it's a weekend and they aren't a weekend worker (and no override)
      if (weekendOnTarget && !employee.weekendWorker && !isWeekendOverride) {
        continue;
      }

      // 3. Skip if it's a holiday and they aren't a holiday worker (and no override)
      if (holidayOnTarget && !employee.holidayWorker && !isHolidayOverride) {
        continue;
      }

      const attendance = await Attendance.findOne({
        employeeId: employee._id,
        date: targetDateStr
      });

      if (!attendance) {
        await Attendance.create({
          employeeId: employee._id,
          shiftId: schedule?.shiftId || employee.shiftId,
          date: targetDateStr,
          status: 'absent',
          signInMethod: 'manual'
        });
        console.log(`Marked ${employee.name} as absent for ${targetDateStr}`);
      }
    }
    console.log('Auto-Absence Job completed.');
  } catch (error) {
    console.error('Error in Auto-Absence Job:', error);
  }
});
