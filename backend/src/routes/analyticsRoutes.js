const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect, authorize('admin', 'manager', 'supervisor'));

router.get('/attendance-overview', analyticsController.getAttendanceOverview);
router.get('/workforce-summary', analyticsController.getWorkforceSummary);
router.get('/department-attendance', analyticsController.getDepartmentAttendance);
router.get('/late-workers', analyticsController.getLateWorkers);
router.get('/reliability-scores', analyticsController.getReliabilityScores);

module.exports = router;
