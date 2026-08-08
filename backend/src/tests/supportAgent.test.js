const {
  handleMessage,
  classifyIntent,
  detectSensitiveAction,
  generateSupportAnswer,
  FALLBACK_UNKNOWN,
  NO_EMPLOYEE_RECORD
} = require('../services/agents/EmployeeSupportAgent');
const { createEmployee } = require('../repositories/employeeRepository');
const { createWorkflow } = require('../repositories/workflowRepository');
const { createTask } = require('../repositories/taskRepository');
const { createApproval } = require('../repositories/approvalRepository');
const { listMessagesByEmployee } = require('../repositories/chatRepository');
const { listSupportRequestsByEmployee } = require('../repositories/supportRequestRepository');

describe('EmployeeSupportAgent', () => {
  const originalKey = process.env.GEMINI_API_KEY;
  let employee;

  beforeAll(async () => {
    delete process.env.GEMINI_API_KEY;
    employee = await createEmployee({
      name: 'Ava Sharma',
      email: 'ava@example.com',
      role: 'Software Engineer',
      department: 'Engineering',
      location: 'US',
      clearance: 'Confidential',
      joiningDate: new Date('2026-08-02'),
      status: 'Provisioning'
    });
    const workflow = await createWorkflow({
      employeeId: employee._id,
      title: 'Onboarding for Ava Sharma',
      status: 'Waiting Approval',
      priority: 'High'
    });
    await createTask({
      workflowId: workflow._id,
      title: 'Provision IT access',
      department: 'IT',
      assignedDepartment: 'IT',
      status: 'Completed',
      priority: 'High'
    });
    await createTask({
      workflowId: workflow._id,
      title: 'Request privileged access',
      department: 'Security',
      assignedDepartment: 'Security',
      status: 'Pending',
      priority: 'High'
    });
    await createApproval({
      workflowId: workflow._id,
      employeeId: employee._id,
      resource: 'GitHub Organization Admin',
      status: 'Pending',
      requestedBy: 'Security Manager'
    });
  });

  afterAll(() => {
    process.env.GEMINI_API_KEY = originalKey;
  });

  const avaUser = () => ({ sub: 'user-ava', email: 'ava@example.com', role: 'HR' });

  describe('classifyIntent', () => {
    it.each([
      ["What's my onboarding status?", 'onboarding_status'],
      ['What tasks are still pending?', 'task_status'],
      ['Which software will I receive?', 'it_access'],
      ['Is my GitHub access approved?', 'approval_status'],
      ['How do I apply for leave?', 'leave_info'],
      ['Who should I contact about payroll?', 'payroll_info'],
      ['What documents do I still need to submit?', 'documents'],
      ['I cannot log in, please help', 'support_request'],
      ['What is the meaning of life?', 'general']
    ])('classifies "%s" as %s', (message, expected) => {
      expect(classifyIntent(message)).toBe(expected);
    });
  });

  describe('detectSensitiveAction', () => {
    it('flags password reset as an IT action', () => {
      expect(detectSensitiveAction('Can you reset my password?')).toMatchObject({ category: 'IT' });
    });

    it('flags production access as a Security action', () => {
      expect(detectSensitiveAction('I need production access for my team.')).toMatchObject({ category: 'Security' });
    });

    it('flags salary changes as a Finance action', () => {
      expect(detectSensitiveAction('I would like to change my salary details.')).toMatchObject({ category: 'Finance' });
    });

    it('returns null for informational questions', () => {
      expect(detectSensitiveAction('What is my onboarding status?')).toBeNull();
    });
  });

  describe('handleMessage', () => {
    it('answers onboarding status from verified data', async () => {
      const result = await handleMessage({ user: avaUser(), message: "What's my onboarding status?" });
      expect(result.intent).toBe('onboarding_status');
      expect(result.answer).toContain('Waiting Approval');
      expect(result.answer).toContain('Request privileged access');
      expect(result.actionRequired).toBe(false);
    });

    it('answers approval status from verified approval records', async () => {
      const result = await handleMessage({ user: avaUser(), message: 'Is my GitHub access approved?' });
      expect(result.intent).toBe('approval_status');
      expect(result.answer).toContain('GitHub Organization Admin');
      expect(result.answer).toContain('pending manager approval');
    });

    it('reports pending tasks', async () => {
      const result = await handleMessage({ user: avaUser(), message: 'What tasks are still pending?' });
      expect(result.intent).toBe('task_status');
      expect(result.answer).toContain('Request privileged access');
      expect(result.answer).not.toContain('Provision IT access');
    });

    it('lists entitled software from the role policy', async () => {
      const result = await handleMessage({ user: avaUser(), message: 'Which software will I receive?' });
      expect(result.intent).toBe('it_access');
      expect(result.answer).toContain('GitHub');
      expect(result.answer).toContain('Slack');
    });

    it('creates a support request for sensitive actions instead of acting', async () => {
      const result = await handleMessage({ user: avaUser(), message: 'Please reset my password.' });
      expect(result.actionRequired).toBe(true);
      expect(result.actionTaken).toBe('support_request_created');
      expect(result.escalation).toMatchObject({ status: 'routed', department: 'IT' });
      expect(result.requestId).toBeTruthy();

      const requests = await listSupportRequestsByEmployee(String(employee._id));
      expect(requests.length).toBe(1);
      expect(requests[0]).toMatchObject({ category: 'IT', status: 'Pending' });
      expect(result.answer).toContain('human approval');
    });

    it('never approves privileged access itself', async () => {
      const result = await handleMessage({ user: avaUser(), message: 'Grant me production access right now.' });
      expect(result.actionRequired).toBe(true);
      expect(result.answer.toLowerCase()).not.toMatch(/granted|approved|done/);
    });

    it('returns the honest fallback for unanswerable questions', async () => {
      const result = await handleMessage({ user: avaUser(), message: 'What is the meaning of life?' });
      expect(result.answer).toBe(FALLBACK_UNKNOWN);
      expect(result.actionRequired).toBe(false);
    });

    it('returns a clear message when no employee profile is linked', async () => {
      const result = await handleMessage({ user: { sub: 'user-nobody', email: 'nobody@example.com', role: 'HR' }, message: "What's my onboarding status?" });
      expect(result.answer).toBe(NO_EMPLOYEE_RECORD);
    });

    it('persists the conversation so follow-ups share a session', async () => {
      const first = await handleMessage({ user: avaUser(), message: "What's my onboarding status?" });
      const second = await handleMessage({ user: avaUser(), message: 'What tasks are still pending?', sessionId: first.sessionId });

      expect(second.sessionId).toBe(first.sessionId);
      const messages = await listMessagesByEmployee(String(employee._id), String(avaUser().sub));
      expect(messages.some((entry) => entry.message === "What's my onboarding status?")).toBe(true);
      expect(messages.some((entry) => entry.message === 'What tasks are still pending?')).toBe(true);
    });
  });

  describe('Gemini integration', () => {
    it('uses the Gemini answer when the model responds with valid JSON', async () => {
      const fakeFetch = async () => ({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify({ answer: 'Your GitHub access request is currently pending manager approval.' }) }] } }]
        })
      });
      const result = await handleMessage({ user: avaUser(), message: 'Is my GitHub access approved?' }, { fetchImpl: fakeFetch });
      expect(result.answer).toContain('pending manager approval');
    });

    it('falls back to templates when Gemini fails and does not crash', async () => {
      const failingFetch = async () => ({ ok: false, json: async () => ({}) });
      const result = await handleMessage({ user: avaUser(), message: 'Is my GitHub access approved?' }, { fetchImpl: failingFetch });
      expect(result.answer).toContain('GitHub Organization Admin');
    });

    it('returns null from generateSupportAnswer when the model is unreachable', async () => {
      const answer = await generateSupportAnswer(
        { message: 'hi', intent: 'general', context: {}, history: [] },
        async () => {
          throw new Error('network down');
        }
      );
      expect(answer).toBeNull();
    });
  });
});
