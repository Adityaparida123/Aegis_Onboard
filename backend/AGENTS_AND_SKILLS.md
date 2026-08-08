# Agents and Skills

## Agent: OnboardingCoordinatorAgent

Location: `src/agents/onboardingCoordinatorAgent.js`

Responsibilities:
- coordinate onboarding flow
- build task lists
- request approvals
- provide reasoning for decisions

## Skill: RoleAccessCalculator

Location: `src/skills/roleAccessCalculatorSkill.js`

Responsibilities:
- map role, department, location, and clearance to software/hardware/permissions
- return approval requirements from configured policies

## Agent: EmployeeSupportAgent

Location: `src/services/agents/EmployeeSupportAgent.js`

The conversational support agent answers employee questions from verified records and safely routes sensitive actions.

Responsibilities:
- classify intent (onboarding status, task status, IT access, approval status, leave, payroll, documents, support request, general)
- detect sensitive actions (password reset, access grants, salary/bank changes, etc.) and route them to a support request for human approval instead of acting
- answer from verified employee context (workflows, tasks, approvals, role policy)
- optionally compose answers with Gemini (`gemini-2.0-flash`) and fall back to deterministic templates when the model is unavailable
- persist every exchange as a chat session/message and write an audit log entry

Location: `src/services/agents/tools/`

Skills/tools used by the agent:
- `employeeContextTool` — load employee + verified context for the JWT user
- `policySearchTool` — find the role/department access policy
- `onboardingStatusTool` — summarize onboarding status and waiting-approval tasks
- `taskStatusTool` — list pending / waiting-approval tasks
- `approvalStatusTool` — match approval records against a natural-language query
- `createRequestTool` — create a routed `SupportRequest` (never performed automatically)
- `auditLogTool` — append a hash-chained audit event for every interaction

Sensitive actions are never performed by the agent: `detectSensitiveAction` maps them to a department (IT/Finance/Security/HR) and `createRequestTool` records the request with status `Pending` and source `chat`.
