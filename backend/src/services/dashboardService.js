const { listWorkflows } = require('../repositories/workflowRepository');
const { listTasks } = require('../repositories/taskRepository');
const { listApprovals } = require('../repositories/approvalRepository');

function buildDailyOnboardings(workflows) {
  const counts = {};
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    counts[date.toISOString().slice(0, 10)] = 0;
  }

  workflows.forEach((workflow) => {
    const date = workflow.createdAt ? new Date(workflow.createdAt).toISOString().slice(0, 10) : null;
    if (date && date in counts) {
      counts[date] += 1;
    }
  });

  return counts;
}

async function getDashboardStats() {
  const workflows = await listWorkflows();
  const tasks = await listTasks();
  const approvals = await listApprovals();

  const approvedCount = approvals.filter((approval) => approval.status === 'Approved').length;

  return {
    pendingWorkflows: workflows.filter((workflow) => workflow.status === 'Pending').length,
    completedWorkflows: workflows.filter((workflow) => workflow.status === 'Completed').length,
    failedWorkflows: workflows.filter((workflow) => workflow.status === 'Failed').length,
    inProgressWorkflows: workflows.filter((workflow) => workflow.status === 'In Progress' || workflow.status === 'Waiting Approval').length,
    averageCompletionTime: workflows.length ? Math.round(workflows.reduce((total, workflow) => total + (workflow.durationMinutes || 0), 0) / workflows.length) : 0,
    pendingApprovals: approvals.filter((approval) => approval.status === 'Pending').length,
    approvalRate: approvals.length ? Math.round((approvedCount / approvals.length) * 100) : 0,
    totalApprovals: approvals.length,
    dailyOnboardings: buildDailyOnboardings(workflows),
    tasksByDepartment: tasks.reduce((acc, task) => {
      acc[task.department] = (acc[task.department] || 0) + 1;
      return acc;
    }, {}),
    workflowStatusDistribution: workflows.reduce((acc, workflow) => {
      acc[workflow.status] = (acc[workflow.status] || 0) + 1;
      return acc;
    }, {})
  };
}

module.exports = { getDashboardStats };
