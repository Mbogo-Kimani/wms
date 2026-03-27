const cron = require('node-cron');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const WorkSchedule = require('../models/WorkSchedule');
const CompanySettings = require('../models/CompanySettings');

dayjs.extend(utc);
dayjs.extend(timezone);

// ─────────────────────────────────────────────────────────────────────────────
// Runs daily at 00:05 Nairobi time (21:05 UTC previous day)
// Deletes WorkSchedule override entries whose date has already passed.
// ─────────────────────────────────────────────────────────────────────────────
cron.schedule('5 21 * * *', async () => {
  console.log('[ScheduleCleanup] Running overdue WorkSchedule override cleanup...');
  try {
    const settings = await CompanySettings.findOne();
    const companyTz = settings?.timezone || 'Africa/Nairobi';

    // "Start of today" in UTC — any schedule before this is in the past
    const startOfTodayUTC = dayjs().tz(companyTz).startOf('day').utc().toDate();

    const result = await WorkSchedule.deleteMany({
      date: { $lt: startOfTodayUTC }
    });

    console.log(`[ScheduleCleanup] Removed ${result.deletedCount} overdue schedule override(s).`);
  } catch (error) {
    console.error('[ScheduleCleanup] Error during cleanup:', error);
  }
});
