const { createAuditLog } = require('../../../repositories/auditRepository');

async function auditLogTool({ user, employee, action, reason, input, output, result }) {
  return createAuditLog({
    workflowId: null,
    employeeId: employee ? String(employee._id) : null,
    actor: user?.email || employee?.email || 'system',
    action,
    reason,
    input,
    output,
    result
  });
}

module.exports = { auditLogTool };
