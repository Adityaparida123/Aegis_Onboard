const { serializeContext } = require('../../employeeContextService');

function getOnboardingSummary(context) {
  const serialized = serializeContext(context);
  if (!serialized.onboarding || serialized.onboarding.length === 0) {
    return { present: false, summary: null };
  }

  const active = serialized.onboarding.sort((a, b) => (a.status === 'Completed' ? 1 : 0) - (b.status === 'Completed' ? 1 : 0));
  const current = active[0];
  return {
    present: true,
    summary: {
      status: current.status,
      title: current.title,
      pendingTasks: current.pendingTasks,
      completedCount: current.completedTasks,
      totalCount: current.totalTasks,
      approvals: current.approvals
    }
  };
}

module.exports = { getOnboardingSummary };
