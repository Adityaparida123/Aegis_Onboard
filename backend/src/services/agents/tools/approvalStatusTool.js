const STOPWORDS = new Set(['what', 'when', 'where', 'which', 'whose', 'about', 'with', 'your', 'mine', 'my', 'is', 'are', 'the', 'and', 'for', 'how', 'did', 'will', 'get', 'status', 'access', 'approved', 'approval', 'approve', 'pending', 'request', 'requests']);

function tokens(query) {
  return String(query || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

function getApprovalStatus(context, query) {
  const approvals = context.workflows.flatMap((workflow) =>
    workflow.approvals.map((approval) => ({ ...approval, workflowTitle: workflow.title }))
  );

  const q = tokens(query);
  const matched = q.length
    ? approvals.filter((approval) => {
        const resource = String(approval.resource).toLowerCase();
        return q.some((token) => resource.includes(token));
      })
    : approvals;

  return {
    pending: approvals.filter((approval) => approval.status === 'Pending'),
    matched: matched.map((approval) => ({ resource: approval.resource, status: approval.status, requestedBy: approval.requestedBy }))
  };
}

module.exports = { getApprovalStatus };
