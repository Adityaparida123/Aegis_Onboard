const express = require('express');
const { getAuditByWorkflow, verifyAuditByWorkflow } = require('../controllers/auditController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/:workflowId', authenticate, authorize(['Admin', 'HR', 'IT', 'Finance', 'Security Manager']), getAuditByWorkflow);
router.get('/:workflowId/verify', authenticate, authorize(['Admin', 'HR', 'IT', 'Finance', 'Security Manager']), verifyAuditByWorkflow);

module.exports = router;
