const app = require('../src/app');

const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function call(port, method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  return { status: response.status, data: await response.json() };
}

async function run() {
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const reg = await call(port, 'POST', '/api/auth/register', {
      body: { name: 'Smoke HR', email: 'smoke@example.com', password: 'secret123', role: 'HR' }
    });
    record('register HR user', reg.status === 201);
    const token = reg.data.data.token;

    const webhook = await call(port, 'POST', '/api/hris/webhook', {
      token,
      body: {
        eventType: 'employee.onboarded',
        name: 'Margaret Hamilton',
        email: 'margaret@example.com',
        role: 'Accountant',
        department: 'Finance',
        location: 'US',
        clearance: 'Secret'
      }
    });
    const workflowId = webhook.data.data?.workflow?._id;
    record('HRIS webhook generates a role-aware workflow', webhook.status === 201 && webhook.data.data.acknowledged === true);
    const planTitles = (webhook.data.data?.plan?.tasks ?? []).map((task) => task.title);
    record(
      'plan contains IT, finance, and privileged-access tasks',
      ['Provision IT access', 'Configure finance access', 'Request privileged access'].every((title) => planTitles.includes(title))
    );
    record('workflow starts in Waiting Approval', webhook.data.data?.workflow?.status === 'Waiting Approval');

    const approvalsList = await call(port, 'GET', '/api/approvals', { token });
    const pending = approvalsList.data.data.approvals.filter((a) => a.workflowId === workflowId && a.status === 'Pending');
    record(`approval gates created (${pending.length})`, pending.length > 0);

    for (const approval of pending) {
      await call(port, 'POST', `/api/approvals/${approval._id}/approve`, { token });
    }

    const detail = await call(port, 'GET', `/api/workflows/${workflowId}`, { token });
    const workflow = detail.data.data.workflow;
    record('workflow Completed after approvals', workflow.status === 'Completed');
    record('all tasks Completed', detail.data.data.tasks.every((task) => task.status === 'Completed'));
    record('duration recorded', typeof workflow.durationMinutes === 'number' && workflow.durationMinutes > 0);

    const employee = await call(port, 'GET', '/api/employees', { token });
    const emp = employee.data.data.employees.find((entry) => entry._id === detail.data.data.workflow.employeeId);
    record('employee marked Completed', emp?.status === 'Completed');

    const audit = await call(port, 'GET', `/api/audit/${workflowId}`, { token });
    const actions = audit.data.data.history.map((entry) => entry.action);
    record(
      'audit trail complete',
      ['workflow_generated', 'approval_decision', 'provision_resources', 'workflow_completed'].every((action) => actions.includes(action))
    );

    const integrity = await call(port, 'GET', `/api/audit/${workflowId}/verify`, { token });
    record('audit chain verifies', integrity.data.data.integrity.valid === true);

    const dashboard = await call(port, 'GET', '/api/dashboard', { token });
    const stats = dashboard.data.data;
    record(
      'dashboard reflects throughput',
      stats.completedWorkflows >= 1 && stats.approvalRate === 100 && stats.pendingApprovals === 0
    );

    const notifications = await call(port, 'GET', '/api/notifications', { token });
    record('notifications delivered', notifications.data.data.notifications.length > 0);

    const policies = await call(port, 'GET', '/api/policies', { token });
    record('policies listed', policies.data.data.policies.length >= 6);
  } finally {
    server.close();
  }

  const failed = results.filter((result) => !result.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length === 0 ? 0 : 1);
}

run().catch((error) => {
  console.error('Smoke test crashed:', error);
  process.exit(1);
});
