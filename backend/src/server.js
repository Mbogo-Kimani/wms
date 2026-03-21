require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { errorHandler } = require('./middlewares/errorHandler');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const memoRoutes = require('./routes/memoRoutes');
const reportRoutes = require('./routes/reportRoutes');
const holidayRoutes = require('./routes/holidayRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Cron Jobs
require('./jobs/attendanceAutoAbsent');
require('./jobs/attendanceAutoClockOut');
require('./jobs/leaveYearlyReset');
require('./jobs/antiSleep');

// Connect to Database
connectDB();

const app = express();

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 login requests per windowMs
  message: 'Too many login attempts, please try again after 15 minutes'
});

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(require('./middlewares/responseHandler'));

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/memos', memoRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/policies', require('./routes/policyRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/schedules', require('./routes/scheduleRoutes'));
app.use('/api/holiday-work-requests', require('./routes/holidayWorkRequestRoutes'));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));