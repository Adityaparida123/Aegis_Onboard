const { listTasks, updateTask } = require('../repositories/taskRepository');
const { listApprovalsByWorkflow } = require('../repositories/approvalRepository');
const { findWorkflowById } = require('../repositories/workflowRepository');
const { finalizeWorkflow } = require('../services/provisioningEngine');
const { successResponse } = require('../utils/response');

async function getTasks(_req, res, next) {
  try {
    const tasks = await listTasks();
    successResponse(res, 200, { tasks });
  } catch (error) {
    next(error);
  }
}

async function patchTask(req, res, next) {
  try {
    const task = await updateTask(req.params.id, req.body);

    if (task && req.body.status === 'Completed') {
      const workflow = await findWorkflowById(task.workflowId);
      if (workflow && workflow.status !== 'Completed') {
        const allTasks = await listTasks();
        const workflowTasks = allTasks.filter((entry) => entry.workflowId?.toString() === task.workflowId.toString());
        const allCompleted = workflowTasks.length > 0 && workflowTasks.every((entry) => entry.status === 'Completed');
        const approvals = await listApprovalsByWorkflow(task.workflowId);
        const pendingApprovals = approvals.filter((entry) => entry.status === 'Pending');

        if (allCompleted && pendingApprovals.length === 0) {
          const resources = approvals.filter((entry) => entry.status === 'Approved').map((entry) => entry.resource);
          await finalizeWorkflow(task.workflowId, resources);
        }
      }
    }

    successResponse(res, 200, { task });
  } catch (error) {
    next(error);
  }
}

module.exports = { getTasks, patchTask };
