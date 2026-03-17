const express = require('express');
const router = express.Router();
const { getEmployees, createEmployee, updateEmployee, deleteEmployee, getEmployeeActivity, getEmployee } = require('../controllers/employeeController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { employeeSchema } = require('../utils/validation/employeeSchemas');

router.use(protect);

router.route('/')
  .get(getEmployees)
  .post(authorize('admin', 'manager'), validate(employeeSchema), createEmployee);

router.get('/:id/activity', getEmployeeActivity);

router.route('/:id')
  .get(getEmployee)
  .patch(authorize('admin', 'manager'), validate(employeeSchema), updateEmployee)
  .delete(authorize('admin', 'manager'), deleteEmployee);

module.exports = router;
