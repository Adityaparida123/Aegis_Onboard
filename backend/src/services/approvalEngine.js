const { createApproval, updateApproval, listApprovalsByWorkflow } = require('../repositories/approvalRepository');
const { updateWorkflow } = require('../repositories/workflowRepository');
const { createAuditLog } = require('../repositories/auditRepository');
const { finalizeWorkflow } = require('./provisioningEngine');
const { sendNotification } = require('./notificationService');
const { AppError } = require('../utils/errors');

async function createApprovalRequests(workflowId, employeeId, approvals = []) {
  const created = [];
  for (const approval of approvals) {
    created.push(
      await createApproval({
        workflowId,
        employeeId,
        resource: approval.resource,
        status: 'Pending',
        requestedBy: approval.requestedBy || 'System'
      })
    );
  }

  await updateWorkflow(workflowId, { status: 'Waiting Approval' });
  return created;
}

async function respondToApproval(approvalId, decision, actor = 'Security Manager') {
  const approval = await updateApproval(approvalId, {
    status: decision === 'approve' ? 'Approved' : 'Rejected',
    decision,
    requestedBy: actor
  });

  if (!approval) {
    throw new AppError('Approval not found', 404);
  }

  await createAuditLog({
    workflowId: approval.workflowId,
    employeeId: approval.employeeId,
    actor,
    action: 'approval_decision',
    reason: decision,
    input: { approvalId },
    output: approval,
    result: decision
  });

  const approvals = await listApprovalsByWorkflow(approval.workflowId);

  if (decision === 'approve') {
    const pending = approvals.filter((entry) => entry.status === 'Pending');
    if (pending.length === 0) {
      const resources = approvals.filter((entry) => entry.status === 'Approved').map((entry) => entry.resource);
      await finalizeWorkflow(approval.workflowId, resources);
      await sendNotification(actor, `Onboarding finalized after all approvals were granted`, 'success');
    } else {
      await updateWorkflow(approval.workflowId, { status: 'Waiting Approval' });
      await sendNotification(actor, `Approval granted for ${approval.resource}; ${pending.length} pending`, 'info');
    }
  } else {
    await updateWorkflow(approval.workflowId, { status: 'Failed' });
    await sendNotification(actor, `Approval rejected for ${approval.resource}; onboarding blocked`, 'warning');
  }

  return approval;
}

module.exports = { createApprovalRequests, respondToApproval };
