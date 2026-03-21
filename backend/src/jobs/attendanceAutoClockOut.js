const cron = require('node-cron');
const dayjs = require('dayjs');
const Attendance = require('../models/Attendance');
const CompanySettings = require('../models/CompanySettings');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

// Run every 30 minutes to clean up stale shifts
cron.schedule('*/30 * * * *', async () => {
    console.log('Running Auto-Clock-Out Job...');
    try {
        const settings = await CompanySettings.findOne();
        const companyTz = settings?.timezone || 'UTC';
        const now = dayjs().tz(companyTz);

        // Find all active attendance records (no signOutTime)
        const activeSessions = await Attendance.find({
            signOutTime: { $exists: false },
            signInTime: { $exists: true }
        }).populate('shiftId');

        for (const session of activeSessions) {
            const shift = session.shiftId;
            if (!shift) continue;

            const [startH] = shift.startTime.split(':');
            const [endH] = shift.endTime.split(':');
            const isNightShift = parseInt(endH) < parseInt(startH);
            
            const hoursLimit = isNightShift ? 7 : 8;
            const sessionDurationHours = now.diff(dayjs(session.signInTime), 'hour', true);

            if (sessionDurationHours >= hoursLimit) {
                // Auto-clock-out
                session.signOutTime = dayjs(session.signInTime).add(hoursLimit, 'hour').toDate();
                session.signOutMethod = 'system';
                session.overtimeMinutes = 0; // System clockouts do not count as overtime
                
                // If they were late, keep it as late. If they were present, keep it present.
                // Do not change status to Overtime.
                if (session.status === 'overtime') session.status = 'present'; 
                
                await session.save();
                console.log(`Auto-Clocked-Out session for employee ${session.employeeId} (Duration: ${hoursLimit}h)`);
            }
        }
        console.log('Auto-Clock-Out Job completed.');
    } catch (error) {
        console.error('Error in Auto-Clock-Out Job:', error);
    }
});
