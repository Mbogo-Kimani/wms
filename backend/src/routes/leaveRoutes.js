const express = require('express');
const router = express.Router();
const { applyLeave, approveLeave, rejectLeave, getLeaves, createLeave, getLeaveBalance } = require('../controllers/leaveController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { leaveSchema } = require('../utils/validation/leaveSchemas');

router.route('/')
  .get(protect, getLeaves)
  .post(protect, validate(leaveSchema), createLeave);

router.get('/balance', protect, getLeaveBalance);

router.put('/:id/approve', protect, authorize('admin', 'manager', 'hr'), approveLeave);
router.put('/:id/reject', protect, authorize('admin', 'manager', 'hr'), rejectLeave);

module.exports = router;