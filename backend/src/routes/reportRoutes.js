const express = require('express');
const router = express.Router();
const { getDailyAttendance, getShiftSummary, getLeaveSummary } = require('../controllers/reportController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.use(authorize('admin', 'manager', 'supervisor'));
router.get('/daily-attendance', getDailyAttendance);
router.get('/shift-summary', getShiftSummary);
router.get('/leave-summary', getLeaveSummary);
module.exports = router;
