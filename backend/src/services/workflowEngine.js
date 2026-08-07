const { createWorkflow } = require('../repositories/workflowRepository');
const { createTask } = require('../repositories/taskRepository');
const { createApproval } = require('../repositories/approvalRepository');
const { createAuditLog } = require('../repositories/auditRepository');
const { coordinateOnboarding } = require('../agents/onboardingCoordinatorAgent');
const { createEmployee, findEmployeeById } = require('../repositories/employeeRepository');
const { sendNotification } = require('./notificationService');

async function generateWorkflow(payload, actor = 'HR') {
  const hasProfile = Boolean(payload.name || payload.email);
  let employee = null;
  let profile = payload;

  if (hasProfile) {
    employee = await createEmployee({
      name: payload.name,
      email: payload.email,
      role: payload.role,
      department: payload.department,
      location: payload.location,
      clearance: payload.clearance,
      joiningDate: payload.joiningDate,
      status: 'Provisioning'
    });
  } else if (payload.employeeId) {
    employee = await findEmployeeById(payload.employeeId);
    profile = employee
      ? {
          ...payload,
          name: employee.name,
          role: employee.role,
          department: employee.department,
          location: employee.location,
          clearance: employee.clearance
        }
      : payload;
  }

  const employeeId = employee?._id || payload.employeeId;
  const plan = await coordinateOnboarding(profile);

  const hasApprovals = plan.approvals.length > 0;
  const workflow = await createWorkflow({
    employeeId,
    title: payload.title || plan.title,
    summary: plan.summary,
    status: hasApprovals ? 'Waiting Approval' : 'In Progress',
    priority: payload.priority || 'High',
    startedAt: new Date()
  });

  for (const task of plan.tasks) {
    await createTask({ workflowId: workflow._id, ...task });
  }

  const approvals = [];
  for (const approval of plan.approvals) {
    approvals.push(
      await createApproval({
        workflowId: workflow._id,
        employeeId,
        resource: approval.resource,
        status: 'Pending',
        requestedBy: actor
      })
    );
  }

  await createAuditLog({
    workflowId: workflow._id,
    employeeId,
    actor,
    action: 'workflow_generated',
    reason: 'Offer letter processed',
    input: payload,
    output: plan,
    result: 'Workflow generated'
  });

  await sendNotification(actor, `Workflow generated: ${workflow.title} (${workflow.status})`, 'info');

  return { workflow, employee, plan, approvals };
}

module.exports = { generateWorkflow };
