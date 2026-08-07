# API Reference

## Authentication

### POST /api/auth/register

Registers a new user.

### POST /api/auth/login

Authenticates a user and returns a JWT.

## Employees

### GET /api/employees

Returns all employees.

### GET /api/employees/:id

Returns a single employee.

## Workflows

### POST /api/workflows

Creates a workflow from onboarding data. Persists the agent-generated tasks and approval requests, and starts the workflow in `Waiting Approval` (if approvals exist) or `In Progress`.

### GET /api/workflows

Returns all workflows.

### GET /api/workflows/:id

Returns a workflow along with its tasks and approvals.

## Tasks

### GET /api/tasks

Returns all tasks.

### PATCH /api/tasks/:id

Updates a task status or fields. When the final task is marked `Completed` (and no approvals are pending) the workflow is finalized and resources are provisioned.

## Approvals

### GET /api/approvals

Returns all approval requests.

### POST /api/approvals/:id

Creates approval requests for a workflow.

### POST /api/approvals/:id/approve

Approves a pending request. When all approvals for the workflow are granted, resources are provisioned, tasks are marked completed, and the workflow/employee are marked `Completed`.

### POST /api/approvals/:id/reject

Rejects a pending request and marks the workflow `Failed`.

## Audit

### GET /api/audit/:workflowId

Returns all audit events for a workflow. Every event is hash-chained: it stores a `prevHash` and a `hash` so the history can be verified for tampering.

### GET /api/audit/:workflowId/verify

Returns `{ integrity: { valid, count } }` after recomputing the hash chain for a workflow. `valid` is `false` if any log entry has been altered.

## Dashboard

### GET /api/dashboard

Returns dashboard metrics including workflow counts, approval rate, daily onboardings, and task distribution.

## Notifications

### GET /api/notifications

Returns notifications for the authenticated user.

## Upload

### POST /api/upload-offer

Uploads an offer letter PDF and triggers onboarding. Returns the extracted employee profile, the generated workflow, the task plan, and the auto-created approval requests.

## HRIS webhook

### POST /api/hris/webhook

Accepts an employee profile event (e.g. from an HRIS) and triggers onboarding workflow generation.

Body shape: `{ eventType?, name, email, role, department, location?, clearance?, joiningDate? }` where `eventType` is `employee.onboarded` or `employee.updated`.

## Policies

### GET /api/policies

Returns the role-based access policies (software, hardware, permissions, and approval requirements per role). These policies drive the onboarding coordinator's plan.

### PATCH /api/policies/:id

Updates a policy (clearance, location, or any of the array fields). The change is written to the audit log as `policy_updated` and is applied to all subsequently generated workflows.

## AI planning

When `GEMINI_API_KEY` is set in the environment, the onboarding coordinator uses Gemini to generate the task plan (tasks, dependencies, approval gates, and access needs). Without a key — or if the model response fails validation — it falls back to the rule-based role policy planner.
