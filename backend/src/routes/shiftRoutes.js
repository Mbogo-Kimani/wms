const express = require('express');
const router = express.Router();
const { getShifts, createShift, updateShift, deleteShift } = require('../controllers/shiftController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { shiftSchema } = require('../utils/validation/shiftSchemas');

router.use(protect);

router.route('/')
  .get(authorize('admin', 'manager', 'supervisor'), getShifts)
  .post(authorize('admin', 'manager'), validate(shiftSchema), createShift);

router.route('/:id')
  .patch(authorize('admin', 'manager'), validate(shiftSchema), updateShift)
  .delete(authorize('admin', 'manager'), deleteShift);

module.exports = router;
