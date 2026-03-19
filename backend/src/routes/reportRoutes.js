const express = require('express');
const router = express.Router();
const { getDailyAttendance, getAttendanceReport, getShiftSummary, getLeaveSummary, getReportStats, exportReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.use(authorize('admin', 'manager', 'supervisor'));
router.get('/daily-attendance', getDailyAttendance);
router.get('/attendance-report', getAttendanceReport);
router.get('/shift-summary', getShiftSummary);
router.get('/leave-summary', getLeaveSummary);
router.get('/stats', getReportStats);
router.get('/export/:type', exportReport);
module.exports = router;
