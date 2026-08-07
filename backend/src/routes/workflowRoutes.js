const express = require('express');
const { createWorkflow, getWorkflows, getWorkflowById } = require('../controllers/workflowController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.post('/', authenticate, authorize(['Admin', 'HR', 'IT', 'Finance', 'Security Manager']), createWorkflow);
router.get('/', authenticate, authorize(['Admin', 'HR', 'IT', 'Finance', 'Security Manager']), getWorkflows);
router.get('/:id', authenticate, authorize(['Admin', 'HR', 'IT', 'Finance', 'Security Manager']), getWorkflowById);

module.exports = router;
