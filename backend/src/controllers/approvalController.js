const { createApprovalRequests, respondToApproval } = require('../services/approvalEngine');
const { listApprovals } = require('../repositories/approvalRepository');
const { successResponse } = require('../utils/response');

async function getApprovals(_req, res, next) {
  try {
    const approvals = await listApprovals();
    successResponse(res, 200, { approvals });
  } catch (error) {
    next(error);
  }
}

async function createApprovals(req, res, next) {
  try {
    const approvals = await createApprovalRequests(req.params.id, req.body.employeeId, req.body.approvals || []);
    successResponse(res, 201, { approvals });
  } catch (error) {
    next(error);
  }
}

async function approveApproval(req, res, next) {
  try {
    const approval = await respondToApproval(req.params.id, 'approve', req.user?.email || 'system');
    successResponse(res, 200, { approval });
  } catch (error) {
    next(error);
  }
}

async function rejectApproval(req, res, next) {
  try {
    const approval = await respondToApproval(req.params.id, 'reject', req.user?.email || 'system');
    successResponse(res, 200, { approval });
  } catch (error) {
    next(error);
  }
}

module.exports = { getApprovals, createApprovals, approveApproval, rejectApproval };
