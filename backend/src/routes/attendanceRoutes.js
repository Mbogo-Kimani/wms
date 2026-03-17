const express = require('express');
const router = express.Router();
const { signIn, signOut, getTodayAttendance, getWorkerHistory, getAllHistory } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middlewares/auth');

router.get('/today', protect, getTodayAttendance);
router.post('/signin', protect, authorize('worker', 'supervisor'), signIn);
router.post('/signout', protect, authorize('worker', 'supervisor'), signOut);
router.get('/history', protect, getWorkerHistory);
router.get('/all-history', protect, authorize('admin', 'manager', 'supervisor'), getAllHistory);
module.exports = router;