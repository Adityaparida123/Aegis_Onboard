const { loadEmployeeContext } = require('./tools/employeeContextTool');
const { getOnboardingSummary } = require('./tools/onboardingStatusTool');
const { listPendingTasks } = require('./tools/taskStatusTool');
const { getApprovalStatus } = require('./tools/approvalStatusTool');
const { createRequestTool } = require('./tools/createRequestTool');
const { auditLogTool } = require('./tools/auditLogTool');
const {
  createChatSession,
  findChatSessionById,
  touchChatSession,
  createChatMessage,
  listMessagesBySession
} = require('../../repositories/chatRepository');

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const FALLBACK_UNKNOWN =
  "I don't have enough verified information to answer that. I can create a request for HR/IT/Security to assist you.";

const NO_EMPLOYEE_RECORD =
  "I couldn't find a verified employee profile linked to your account. Please contact HR so they can associate your account with your employee record.";

const SUGGESTED_QUESTIONS = [
  "What's my onboarding status?",
  'What tasks are still pending?',
  'Which software will I receive?',
  'Is my GitHub access approved?',
  'How do I apply for leave?',
  'Who should I contact about payroll?',
  'What documents do I still need to submit?'
];

function isAIConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

function extractJson(text) {
  const trimmed = String(text).trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse(fenced ? fenced[1] : trimmed);
}

const INTENT_PATTERNS = [
  { intent: 'greeting', patterns: [/^(hi|hello|hey|good morning|good afternoon|good evening)\b/i] },
  {
    intent: 'onboarding_status',
    patterns: [/onboard/i, /my status/i, /where am i in/i, /how far along/i, /what('|')s my status/i, /joining date/i, /start date/i]
  },
  {
    intent: 'task_status',
    patterns: [/pending task/i, /tasks? .{0,12}pending/i, /what('|')s next/i, /to-?do/i, /what remains/i, /what do i need to do/i, /next step/i, /what still needs/i, /remaining/i]
  },
  {
    intent: 'documents',
    patterns: [/document/i, /identity card/i, /id card/i, /i-?9/i, /paperwork/i, /upload/i, /visa/i, /passport/i, /signed form/i, /bank details.*submit/i]
  },
  {
    intent: 'approval_status',
    patterns: [/approval/i, /approved/i, /approver/i, /when will i get/i, /will i get/i, /is my .*access/i, /did my/i, /access.*granted/i, /access.*approved/i]
  },
  { intent: 'leave_info', patterns: [/leave/i, /vacation/i, /holiday/i, /time off/i, /pto/i, /sick day/i] },
  {
    intent: 'payroll_info',
    patterns: [/payroll/i, /salary/i, /payslip/i, /pay ?check/i, /compensation/i, /benefits/i, /insurance/i, /healthcare/i, /401k/i, /retirement/i]
  },
  {
    intent: 'security_access',
    patterns: [/privileged/i, /production access/i, /root access/i, /admin access/i, /security permission/i, /clearance/i, /security access/i, /badge access/i, /vault/i, /siem/i]
  },
  {
    intent: 'it_access',
    patterns: [/software/i, /laptop/i, /computer/i, /vpn/i, /email account/i, /license/i, /login/i, /wifi/i, /slack/i, /github/i, /jira/i, /tool/i, /application/i]
  },
  {
    intent: 'policy_info',
    patterns: [/policy/i, /procedure/i, /rule/i, /handbook/i, /allowed to/i, /can i/i, /how do i/i, /dress code/i, /remote work/i, /working hours/i, /work hours/i]
  },
  {
    intent: 'workplace_info',
    patterns: [/office/i, /workplace/i, /parking/i, /cafeteria/i, /where is/i, /first day/i, /who do i contact/i, /who should i/i, /mentor/i, /when do i start/i]
  },
  {
    intent: 'support_request',
    patterns: [
      /escalat/i,
      /talk to a human/i,
      /speak to/i,
      /contact hr/i,
      /contact it/i,
      /contact finance/i,
      /contact security/i,
      /raise a ticket/i,
      /create a ticket/i,
      /can't log in/i,
      /cannot log in/i,
      /issue with/i,
      /problem with/i,
      /broken/i,
      /urgent/i
    ]
  }
];

const SENSITIVE_PATTERNS = [
  {
    category: 'Security',
    patterns: [
      /(grant|give|need|request|ask for|want).{0,40}(production|root|admin|privileged|elevated).{0,20}access/i,
      /(production|root|admin|privileged).{0,20}access.{0,40}(grant|give|need|request|approve)/i,
      /elevate my access/i,
      /approve my access/i,
      /give me access to (vault|siem|server|database|production)/i,
      /request access to (vault|siem|server|database|production)/i
    ]
  },
  {
    category: 'IT',
    patterns: [
      /(reset|change).{0,20}(password|pin|passcode)/i,
      /(password|pin|passcode).{0,20}(reset|change|recover)/i,
      /unlock my account/i,
      /account (locked|blocked)/i,
      /new (laptop|computer|monitor|headset)/i,
      /request (new )?(software|tool|license|application|vpn)/i,
      /(install|request).{0,20}software/i
    ]
  },
  {
    category: 'Finance',
    patterns: [
      /(salary|compensation|pay).{0,30}(change|increase|raise|adjust|review|correction)/i,
      /change my (bank|salary|pay|tax)/i,
      /update my (bank|salary|pay|tax)/i,
      /bank account (change|update)/i,
      /payslip (correction|change|issue)/i,
      /(access|view).{0,20}(financial|payroll) (data|report|records)/i
    ]
  },
  {
    category: 'HR',
    patterns: [
      /change my (name|address|department|manager|emergency contact)/i,
      /update my (name|address|emergency contact)/i,
      /transfer (to|request)/i,
      /resign/i,
      /personal information change/i
    ]
  }
];

function classifyIntent(message) {
  const text = String(message || '').trim();
  for (const entry of INTENT_PATTERNS) {
    if (entry.patterns.some((pattern) => pattern.test(text))) {
      return entry.intent;
    }
  }
  return 'general';
}

function detectSensitiveAction(message) {
  const text = String(message || '').trim();
  for (const entry of SENSITIVE_PATTERNS) {
    if (entry.patterns.some((pattern) => pattern.test(text))) {
      return { category: entry.category, sensitive: true };
    }
  }
  return null;
}

function detectRequestCategory(message) {
  const text = String(message || '').toLowerCase();
  if (/security|production|access|permission|badge|vault|clearance/.test(text)) return 'Security';
  if (/finance|payroll|salary|payslip|tax|bank|expense/.test(text)) return 'Finance';
  if (/it|computer|laptop|software|vpn|password|email|wifi|login|account|slack|github|jira/.test(text)) return 'IT';
  if (/hr|leave|benefit|onboarding|document|payroll benefit/.test(text)) return 'HR';
  return 'HR';
}

function buildRequestSubject(message, intent) {
  const text = String(message || '').trim().replace(/\s+/g, ' ');
  const prefix = intent === 'support_request' ? 'Support request' : 'Request';
  return `${prefix}: ${text.slice(0, 80)}${text.length > 80 ? '…' : ''}`;
}

function formatList(items) {
  return items.map((item) => `- ${item}`).join('\n');
}

function buildFallbackAnswer({ message, intent, context, employee }) {
  switch (intent) {
    case 'greeting': {
      const name = employee?.name?.split(' ')[0];
      return `Hi ${name || 'there'}! I'm your Aegis employee support assistant. Ask me about your onboarding, pending tasks, approvals, or software entitlements — or I can create a request for HR, IT, Finance, or Security.`;
    }
    case 'onboarding_status': {
      const summary = getOnboardingSummary(context);
      if (!summary.present) {
        return "I don't have a verified onboarding workflow in your record yet.";
      }
      const { status, pendingTasks, completedCount, totalCount } = summary.summary;
      if (status === 'Completed') {
        return 'Your onboarding is complete. All verified onboarding workflows for your account are finished.';
      }
      const lines = [`Your onboarding status is currently "${status}".`];
      if (pendingTasks.length > 0) {
        lines.push(`You still have ${pendingTasks.length} pending task(s):\n${formatList(pendingTasks)}`);
      }
      if (totalCount > 0) {
        lines.push(`${completedCount} of ${totalCount} tasks are completed.`);
      }
      return lines.join(' ');
    }
    case 'task_status': {
      const pending = listPendingTasks(context).map((task) => task.title);
      if (pending.length === 0) {
        return 'You have no pending onboarding tasks right now.';
      }
      return `You have ${pending.length} pending task(s):\n${formatList(pending)}`;
    }
    case 'documents':
      return "I don't have verified document-upload records in your profile. Check your pending onboarding tasks for required documents, or I can create an HR request to confirm exactly what you need to submit.";
    case 'approval_status': {
      const approvalStatus = getApprovalStatus(context, message);
      if (approvalStatus.matched.length > 0) {
        return approvalStatus.matched
          .map((approval) => {
            const statusText =
              approval.status === 'Pending'
                ? 'pending manager approval'
                : approval.status === 'Approved'
                  ? 'approved'
                  : approval.status === 'Rejected'
                    ? 'rejected'
                    : approval.status.toLowerCase();
            return `Your ${approval.resource} access request is currently ${statusText}.`;
          })
          .join(' ');
      }
      if (approvalStatus.pending.length > 0) {
        return `You have ${approvalStatus.pending.length} pending approval request(s):\n${formatList(approvalStatus.pending.map((approval) => `${approval.resource} (pending)`))}`;
      }
      return "I don't have a verified approval request matching that in your record.";
    }
    case 'leave_info':
      return "I don't have a verified leave policy in the database to answer that precisely. I can create an HR request about your leave inquiry, or contact the HR team for the current policy.";
    case 'payroll_info':
      return 'Payroll and benefits are managed by Finance. I can create a Finance request for your payroll question, or contact the Finance team directly for help.';
    case 'it_access': {
      const policy = context.policy;
      if (!policy) {
        return "I don't have a verified software policy for your role. I can create an IT request to confirm your entitlements.";
      }
      const lines = [`Based on your ${policy.role} role, you are entitled to:`];
      if (policy.software.length > 0) lines.push(`Software: ${policy.software.join(', ')}`);
      if (policy.hardware.length > 0) lines.push(`Hardware: ${policy.hardware.join(', ')}`);
      if (policy.permissions.length > 0) lines.push(`Permissions: ${policy.permissions.join(', ')}`);
      lines.push("If a tool isn't working or you need something new, I can create an IT request for you.");
      return lines.join(' ');
    }
    case 'security_access': {
      const policy = context.policy;
      const requirements = policy?.approvalRequirements || [];
      const pendingApprovals = getApprovalStatus(context, message).pending;
      const lines = [];
      if (requirements.length > 0) {
        lines.push(`Resources such as ${requirements.join(', ')} require Security Manager approval before they are granted.`);
      }
      if (pendingApprovals.length > 0) {
        lines.push(`You currently have ${pendingApprovals.length} pending approval request(s) in this area.`);
      }
      if (lines.length === 0) {
        return "I don't have verified security-access information in your record. I can create a Security request to check your entitlements.";
      }
      return lines.join(' ');
    }
    case 'policy_info':
      return "I can only share verified policy information. I don't have a policy on that topic in the database. I can create an HR request to confirm the current policy for you.";
    case 'workplace_info': {
      const details = [];
      if (employee?.joiningDate) details.push(`Your joining date is ${new Date(employee.joiningDate).toISOString().slice(0, 10)}.`);
      if (employee?.location) details.push(`Your office location is ${employee.location}.`);
      details.push("I don't have further verified workplace details in the database. I can create an HR request if you need more.");
      return details.join(' ');
    }
    default:
      return FALLBACK_UNKNOWN;
  }
}

function buildEscalationAnswer({ sensitive, category, requestId }) {
  const department = category;
  const requestLine = `Request ID: ${String(requestId).slice(-6)}.`;
  if (sensitive) {
    return `I can't perform that action directly — it requires human approval. I've created a ${category} request (${requestLine}) and routed it to the ${department} team. You'll be notified once it is reviewed.`;
  }
  return `I've escalated this to the ${department} team for review. ${requestLine} A team member will follow up with you.`;
}

function buildPrompt({ message, intent, context, history }) {
  const recentHistory = (history || [])
    .slice(-6)
    .map((entry) => `Employee: ${entry.message}\nAssistant: ${entry.response}`)
    .join('\n\n');

  return [
    'You are the EmployeeSupportAgent for the AEGIS onboarding platform.',
    'You answer employee questions using ONLY the verified context below.',
    'Rules:',
    '- Never invent policies, employee data, permissions, or approval statuses.',
    '- If the verified context does not answer the question, reply exactly:',
    FALLBACK_UNKNOWN,
    '- Be concise, factual, and friendly.',
    `Detected intent: ${intent}`,
    'Verified employee context:',
    JSON.stringify(context, null, 2),
    recentHistory ? `Recent conversation:\n${recentHistory}` : 'Recent conversation: (none)',
    'Employee question:',
    message,
    'Return ONLY valid JSON: {"answer": "your reply"}'
  ].join('\n');
}

async function generateSupportAnswer({ message, intent, context, history }, fetchImpl = globalThis.fetch) {
  if (!isAIConfigured()) {
    return null;
  }
  try {
    const response = await fetchImpl(`${GEMINI_ENDPOINT}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: buildPrompt({ message, intent, context, history }) }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
      })
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return null;
    }
    const parsed = extractJson(text);
    const answer = String(parsed?.answer || '').trim();
    return answer.length > 0 ? answer : null;
  } catch {
    return null;
  }
}

async function persistExchange({ user, employee, sessionId, message, result }) {
  let session = sessionId ? await findChatSessionById(sessionId) : null;
  if (!session) {
    session = await createChatSession({
      employeeId: employee ? String(employee._id) : undefined,
      userId: user?.sub ? String(user.sub) : undefined,
      title: String(message).trim().slice(0, 60) || 'Employee support conversation'
    });
  } else {
    await touchChatSession(session._id);
  }

  await createChatMessage({
    sessionId: session._id,
    employeeId: employee ? String(employee._id) : undefined,
    userId: user?.sub ? String(user.sub) : undefined,
    message,
    response: result.answer,
    intent: result.intent,
    actionTaken: result.actionTaken,
    actionRequired: result.actionRequired,
    requestId: result.requestId,
    escalation: result.escalation
  });

  return session._id;
}

async function handleMessage({ user, message, sessionId, requestedEmployeeId }, options = {}) {
  const { fetchImpl } = options;
  const { employee, context } = await loadEmployeeContext(user, requestedEmployeeId);

  const history = sessionId ? await listMessagesBySession(sessionId) : [];
  const intent = classifyIntent(message);
  const sensitive = detectSensitiveAction(message);

  let answer;
  let actionTaken = 'none';
  let actionRequired = false;
  let escalation = { status: 'none', department: null };
  let requestId = null;

  if (sensitive || intent === 'support_request') {
    const category = sensitive ? sensitive.category : detectRequestCategory(message);
    const request = await createRequestTool({
      user,
      employee,
      category,
      subject: buildRequestSubject(message, intent),
      description: message,
      source: 'chat'
    });
    requestId = request._id;
    actionTaken = 'support_request_created';
    actionRequired = true;
    escalation = { status: 'routed', department: request.assignedDepartment };
    answer = buildEscalationAnswer({ sensitive: Boolean(sensitive), category, requestId });

    await auditLogTool({
      user,
      employee,
      action: sensitive ? 'chat_sensitive_action_escalated' : 'chat_support_request_created',
      reason: `${category} request routed for human review without performing the action`,
      input: { message, intent, category },
      output: { requestId: String(requestId), department: request.assignedDepartment },
      result: 'Routed'
    });
  } else if (!employee || !context) {
    answer = NO_EMPLOYEE_RECORD;
    await auditLogTool({
      user,
      employee,
      action: 'chat_unresolved_employee',
      reason: 'No verified employee profile linked to the account',
      input: { message, intent },
      output: null,
      result: 'Unresolved'
    });
  } else {
    const generated = await generateSupportAnswer({ message, intent, context, history }, fetchImpl);
    answer = generated || buildFallbackAnswer({ message, intent, context, employee });

    await auditLogTool({
      user,
      employee,
      action: 'chat_answered',
      reason: `Answered ${intent} question from verified employee context`,
      input: { message, intent },
      output: { answer },
      result: 'Answered'
    });
  }

  const result = {
    answer,
    intent,
    actionRequired,
    actionTaken,
    escalation,
    requestId: requestId ? String(requestId) : null
  };
  const persistedSessionId = await persistExchange({ user, employee, sessionId, message, result });

  return { ...result, sessionId: persistedSessionId };
}

module.exports = {
  handleMessage,
  classifyIntent,
  detectSensitiveAction,
  detectRequestCategory,
  buildFallbackAnswer,
  buildEscalationAnswer,
  generateSupportAnswer,
  isAIConfigured,
  SUGGESTED_QUESTIONS,
  FALLBACK_UNKNOWN,
  NO_EMPLOYEE_RECORD
};
