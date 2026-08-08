const express = require('express');
const { getEmployeeContext } = require('../controllers/employeeContextController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.get('/context', authenticate, getEmployeeContext);

module.exports = router;
