const cron = require('node-cron');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const WorkSchedule = require('../models/WorkSchedule');
const CompanySettings = require('../models/CompanySettings');
const { isHoliday, isWeekend } = require('../utils/dateUtils');

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Marks absent for employees expected to work on targetDate but have no attendance record.
 * @param {dayjs.Dayjs} targetDay - The day to check (as a dayjs object in company timezone)
 * @param {'day'|'night'} shiftType - Which shift type to process
 */
async function markAbsentees(targetDay, shiftType) {
  try {
    const settings = await CompanySettings.findOne();
    const companyTz = settings?.timezone || 'UTC';

    const targetDateStr = targetDay.format('YYYY-MM-DD');
    const dayNameOnTarget = targetDay.format('dddd'); // e.g. "Monday"

    const holidayOnTarget = await isHoliday(targetDay.toDate());
    const weekendOnTarget = await isWeekend(targetDay.toDate());

    // UTC date boundaries for querying attendance
    const startOfTargetDay = dayjs.utc(targetDateStr).startOf('day').toDate();
    const endOfTargetDay = dayjs.utc(targetDateStr).endOf('day').toDate();

    // Date stored in WorkSchedule is normalized to UTC midnight
    const targetMidnightUTC = dayjs.utc(targetDateStr).startOf('day').toDate();

    const employees = await Employee.find({ status: 'active' }).populate('shiftId');

    let markedCount = 0;

    for (const employee of employees) {
      const shift = employee.shiftId;

      // --- Determine if this employee was supposed to work on targetDate ---

      // Check for a WorkSchedule override for this specific date
      const scheduleOverride = await WorkSchedule.findOne({
        employeeId: employee._id,
        date: targetMidnightUTC
      });

      // Is this a night shift? (endTime hour < startTime hour, e.g. 22:00 -> 06:00)
      let isNightShift = false;
      if (shift) {
        const startH = parseInt(shift.startTime.split(':')[0], 10);
        const endH = parseInt(shift.endTime.split(':')[0], 10);
        isNightShift = endH < startH;
      }

      // Filter by shift type to avoid double-processing
      if (shiftType === 'day' && isNightShift) continue;
      if (shiftType === 'night' && !isNightShift) continue;

      // Determine if they were scheduled to work:
      // Either their shift includes this weekday OR there's an override
      const shiftIncludesDay = shift && Array.isArray(shift.days) && shift.days.includes(dayNameOnTarget);
      const hasOverride = !!scheduleOverride;

      if (!shiftIncludesDay && !hasOverride) {
        // Not supposed to work this day at all
        continue;
      }

      // --- Apply skip guards ---

      // 1. Skip if it's their religious rest day
      if (employee.religiousRestDay && employee.religiousRestDay !== 'None' &&
          employee.religiousRestDay === dayNameOnTarget) {
        console.log(`[AutoAbsent] Skipping ${employee.name} — Religious Rest Day (${dayNameOnTarget})`);
        continue;
      }

      // 2. Skip if it's a weekend and they aren't a weekend worker (and no override)
      const isWeekendOverride = scheduleOverride?.isWeekendShift;
      if (weekendOnTarget && !employee.weekendWorker && !isWeekendOverride) {
        continue;
      }

      // 3. Skip if it's a holiday and they aren't a holiday worker (and no override)
      const isHolidayOverride = scheduleOverride?.isHolidayShift;
      if (holidayOnTarget && !employee.holidayWorker && !isHolidayOverride) {
        continue;
      }

      // --- Check if attendance already exists (use proper date range query) ---
      const attendance = await Attendance.findOne({
        employeeId: employee._id,
        date: { $gte: startOfTargetDay, $lte: endOfTargetDay }
      });

      if (!attendance) {
        // Determine shiftId: prefer override's shiftId, then employee's shift
        const resolvedShiftId = scheduleOverride?.shiftId || employee.shiftId?._id || employee.shiftId;

        if (!resolvedShiftId) {
          console.warn(`[AutoAbsent] Cannot mark absent for ${employee.name} — no shiftId resolved`);
          continue;
        }

        await Attendance.create({
          employeeId: employee._id,
          shiftId: resolvedShiftId,
          date: startOfTargetDay,
          status: 'absent',
          signInMethod: 'manual'
        });

        console.log(`[AutoAbsent] Marked ${employee.name} as ABSENT for ${targetDateStr} (${shiftType} shift)`);
        markedCount++;
      }
    }

    console.log(`[AutoAbsent] ${shiftType} shift run complete for ${targetDateStr}. Marked ${markedCount} absent.`);
  } catch (error) {
    console.error(`[AutoAbsent] Error in markAbsentees (${shiftType}):`, error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RUN 1: 06:00 Nairobi time (03:00 UTC)
// Processes DAY SHIFT workers who didn't clock in yesterday
// ─────────────────────────────────────────────────────────────────────────────
cron.schedule('0 3 * * *', async () => {
  console.log('[AutoAbsent] Run 1 — Day Shift absent check (processing yesterday)...');
  const settings = await CompanySettings.findOne();
  const companyTz = settings?.timezone || 'Africa/Nairobi';
  const yesterday = dayjs().tz(companyTz).subtract(1, 'day');
  await markAbsentees(yesterday, 'day');
});

// ─────────────────────────────────────────────────────────────────────────────
// RUN 2: 12:00 Nairobi time (09:00 UTC)
// Processes NIGHT SHIFT workers who didn't clock in last night
// (Night shifts end in the early morning — by noon all night workers are done)
// ─────────────────────────────────────────────────────────────────────────────
cron.schedule('0 9 * * *', async () => {
  console.log('[AutoAbsent] Run 2 — Night Shift absent check (processing yesterday)...');
  const settings = await CompanySettings.findOne();
  const companyTz = settings?.timezone || 'Africa/Nairobi';
  const yesterday = dayjs().tz(companyTz).subtract(1, 'day');
  await markAbsentees(yesterday, 'night');
});
