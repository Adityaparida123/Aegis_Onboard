# Aegis API Reference

Base URL: http://127.0.0.1:4000

## Health

### GET /health

Returns the API health status.

Response:

```json
{
  "status": "ok"
}
```

## Authentication

### POST /api/auth/register

Creates a user account.

Request body:

```json
{
  "name": "Demo User",
  "email": "demo@aegis.dev",
  "password": "demo1234",
  "role": "HR"
}
```

### POST /api/auth/login

Authenticates a user and returns a JWT.

Request body:

```json
{
  "email": "demo@aegis.dev",
  "password": "demo1234"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "Demo User",
      "email": "demo@aegis.dev",
      "role": "HR"
    },
    "token": "jwt-token"
  }
}
```

Use the returned token in the Authorization header for protected routes:

```http
Authorization: Bearer <token>
```

## Employees

### GET /api/employees

Lists employees.

### GET /api/employees/:id

Fetches one employee by ID.

## Workflows

### POST /api/workflows

Creates a workflow.

Request body:

```json
{
  "employeeId": "employee-123",
  "title": "Provision Access",
  "priority": "High"
}
```

### GET /api/workflows/:id

Fetches one workflow by ID.

## Tasks

### GET /api/tasks

Lists tasks.

### PATCH /api/tasks/:id

Updates a task.

Request body example:

```json
{
  "status": "Completed"
}
```

## Approvals

### POST /api/approvals/:id

Creates approval requests for a workflow.

Request body:

```json
{
  "employeeId": "employee-123",
  "approvals": [
    {
      "resource": "GitHub Admin"
    }
  ]
}
```

### POST /api/approvals/:id/approve

Approves an approval request.

### POST /api/approvals/:id/reject

Rejects an approval request.

## Audit

### GET /api/audit/:workflowId

Returns audit history for a workflow.

## Dashboard

### GET /api/dashboard

Returns dashboard statistics.

## File upload

### POST /api/upload-offer

Uploads an offer document as multipart form-data with a file field named `file`.
