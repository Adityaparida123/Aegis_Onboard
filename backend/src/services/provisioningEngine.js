const { createAuditLog } = require('../repositories/auditRepository');
const { listTasks, updateTask } = require('../repositories/taskRepository');
const { findWorkflowById, updateWorkflow } = require('../repositories/workflowRepository');
const { updateEmployee } = require('../repositories/employeeRepository');
const { sendNotification } = require('./notificationService');
const { AppError } = require('../utils/errors');

async function withRetry(fn, { attempts = 3, baseDelayMs = 200 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, baseDelayMs * attempt));
      }
    }
  }
  throw lastError;
}

async function provisionResource(resource) {
  if (typeof resource !== 'string' || resource.trim().length === 0) {
    throw new AppError(`Invalid provisioning target: ${resource}`, 400);
  }
  return { resource, status: 'Provisioned', message: `Simulated provisioning for ${resource}` };
}

async function provisionResources(workflowId, employeeId, resources = []) {
  const outcomes = await withRetry(async () => {
    const results = [];
    for (const resource of resources) {
      results.push(await provisionResource(resource));
    }
    return results;
  });

  await createAuditLog({
    workflowId,
    employeeId,
    actor: 'System',
    action: 'provision_resources',
    reason: 'Provisioning completed',
    input: resources,
    output: outcomes,
    result: 'Provisioned'
  });

  return outcomes;
}

async function finalizeWorkflow(workflowId, resources = []) {
  const workflow = await findWorkflowById(workflowId);
  if (!workflow) {
    throw new AppError('Workflow not found', 404);
  }
  if (workflow.status === 'Completed') {
    return { workflow, outcomes: [] };
  }

  const outcomes = await provisionResources(workflowId, workflow.employeeId, resources);

  const allTasks = await listTasks();
  const workflowTasks = allTasks.filter((task) => task.workflowId?.toString() === workflowId.toString());
  for (const task of workflowTasks) {
    await updateTask(task._id, { status: 'Completed' });
  }

  const completedAt = new Date();
  const durationMinutes = workflow.startedAt
    ? Math.max(1, Math.round((completedAt - new Date(workflow.startedAt)) / 60000))
    : 1;
  const updated = await updateWorkflow(workflowId, { status: 'Completed', completedAt, durationMinutes });

  if (workflow.employeeId) {
    await updateEmployee(workflow.employeeId, { status: 'Completed' });
  }

  await createAuditLog({
    workflowId,
    employeeId: workflow.employeeId,
    actor: 'System',
    action: 'workflow_completed',
    reason: 'All approvals granted and resources provisioned',
    input: { resources },
    output: { durationMinutes },
    result: 'Completed'
  });

  await sendNotification('system', `Onboarding completed: ${workflow.title}`, 'success');

  return { workflow: updated || workflow, outcomes };
}

module.exports = { provisionResources, finalizeWorkflow, withRetry };
