function listPendingTasks(context) {
  return context.computed.pendingTasks.map((task) => ({
    title: task.title,
    department: task.department
  }));
}

function listWaitingApprovalTasks(context) {
  return context.computed.waitingApprovalTasks.map((task) => ({
    title: task.title,
    department: task.department
  }));
}

function getTaskStatus(context, query) {
  const allTasks = context.workflows.flatMap((workflow) =>
    workflow.tasks.map((task) => ({ ...task, workflowTitle: workflow.title, workflowStatus: workflow.status }))
  );

  const q = String(query || '').toLowerCase().trim();
  const matched = q ? allTasks.filter((task) => String(task.title).toLowerCase().includes(q) || String(task.department).toLowerCase().includes(q)) : allTasks;

  return {
    pending: listPendingTasks(context),
    waitingApproval: listWaitingApprovalTasks(context),
    matched: matched.map((task) => ({ title: task.title, status: task.status, department: task.department }))
  };
}

module.exports = { listPendingTasks, listWaitingApprovalTasks, getTaskStatus };
