const express = require('express');
const { getPolicies, patchPolicy } = require('../controllers/policyController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/', authenticate, authorize(['Admin', 'HR', 'IT', 'Finance', 'Security Manager']), getPolicies);
router.patch('/:id', authenticate, authorize(['Admin', 'HR', 'IT', 'Finance', 'Security Manager']), patchPolicy);

module.exports = router;
