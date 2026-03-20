const express = require('express');
const router = express.Router();
const { getMemos, createMemo, updateMemo, deleteMemo } = require('../controllers/memoController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.route('/')
  .get(getMemos)
  .post(authorize('admin', 'manager'), createMemo);

router.route('/:id')
  .patch(authorize('admin', 'manager'), updateMemo)
  .delete(authorize('admin', 'manager'), deleteMemo);

module.exports = router;
