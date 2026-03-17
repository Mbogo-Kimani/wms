const express = require('express');
const router = express.Router();
const { getPendingRegistrations, verifyWorker, rejectWorker } = require('../controllers/onboardingController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.get('/pending', authorize('admin', 'manager'), getPendingRegistrations);
router.post('/verify', authorize('admin'), verifyWorker);
router.delete('/reject/:userId', authorize('admin'), rejectWorker);
module.exports = router;
