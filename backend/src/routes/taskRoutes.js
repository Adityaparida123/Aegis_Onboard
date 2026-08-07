const express = require('express');
const { getTasks, patchTask } = require('../controllers/taskController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/', authenticate, authorize(['Admin', 'HR', 'IT', 'Finance', 'Security Manager']), getTasks);
router.patch('/:id', authenticate, authorize(['Admin', 'HR', 'IT', 'Finance', 'Security Manager']), patchTask);

module.exports = router;
