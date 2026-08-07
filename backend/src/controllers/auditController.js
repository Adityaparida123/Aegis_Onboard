const { readAuditHistory, verifyAuditHistory } = require('../services/auditService');
const { successResponse } = require('../utils/response');

async function getAuditByWorkflow(req, res, next) {
  try {
    const history = await readAuditHistory(req.params.workflowId);
    successResponse(res, 200, { history });
  } catch (error) {
    next(error);
  }
}

async function verifyAuditByWorkflow(req, res, next) {
  try {
    const integrity = await verifyAuditHistory(req.params.workflowId);
    successResponse(res, 200, { integrity });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAuditByWorkflow, verifyAuditByWorkflow };
