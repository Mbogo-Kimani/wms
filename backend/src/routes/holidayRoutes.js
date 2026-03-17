const express = require('express');
const router = express.Router();
const holidayController = require('../controllers/holidayController');
const { protect, authorize } = require('../middlewares/auth');

router.get('/', protect, holidayController.getHolidays);
router.get('/upcoming', protect, holidayController.getUpcomingHolidays);
router.post('/', protect, authorize('admin'), holidayController.createHoliday);
router.put('/:id', protect, authorize('admin'), holidayController.updateHoliday);
router.delete('/:id', protect, authorize('admin'), holidayController.deleteHoliday);

module.exports = router;
