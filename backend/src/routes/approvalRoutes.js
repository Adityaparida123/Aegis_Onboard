const express = require('express');
const { getApprovals, createApprovals, approveApproval, rejectApproval } = require('../controllers/approvalController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/', authenticate, authorize(['Admin', 'HR', 'IT', 'Finance', 'Security Manager']), getApprovals);
router.post('/:id', authenticate, authorize(['Admin', 'HR', 'IT', 'Finance', 'Security Manager']), createApprovals);
router.post('/:id/approve', authenticate, authorize(['Admin', 'HR', 'IT', 'Finance', 'Security Manager']), approveApproval);
router.post('/:id/reject', authenticate, authorize(['Admin', 'HR', 'IT', 'Finance', 'Security Manager']), rejectApproval);

module.exports = router;
