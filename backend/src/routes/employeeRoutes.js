const express = require('express');
const { getEmployees, getEmployeeById } = require('../controllers/employeeController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/', authenticate, authorize(['Admin', 'HR', 'IT', 'Finance', 'Security Manager']), getEmployees);
router.get('/:id', authenticate, authorize(['Admin', 'HR', 'IT', 'Finance', 'Security Manager']), getEmployeeById);

module.exports = router;
