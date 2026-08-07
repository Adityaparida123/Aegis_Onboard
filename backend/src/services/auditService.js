const { createAuditLog, listAuditLogsByWorkflow, verifyAuditChain } = require('../repositories/auditRepository');

async function logAuditEvent(payload) {
  return createAuditLog(payload);
}

async function readAuditHistory(workflowId) {
  return listAuditLogsByWorkflow(workflowId);
}

async function verifyAuditHistory(workflowId) {
  return verifyAuditChain(workflowId);
}

module.exports = { logAuditEvent, readAuditHistory, verifyAuditHistory };
