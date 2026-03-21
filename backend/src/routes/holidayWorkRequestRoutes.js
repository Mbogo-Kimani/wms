const express = require('express');
const router = express.Router();
const controller = require('../controllers/holidayWorkRequestController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.post('/', controller.createRequest);
router.get('/my', controller.getMyRequests);

// Admin/Manager routes
router.get('/', authorize('admin', 'manager'), controller.getAllRequests);
router.put('/:id/resolve', authorize('admin', 'manager'), controller.resolveRequest);
router.put('/:id/unschedule', authorize('admin', 'manager'), controller.unscheduleRequest);

module.exports = router;
