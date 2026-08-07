# Database Design

## Collections

- User — stores authenticated system users and roles.
- Employee — stores onboarded employee demographics and status.
- Workflow — stores an onboarding workflow record.
- Task — stores dependency-aware tasks for each workflow.
- Approval — captures approvals for privileged resources.
- AuditLog — stores immutable audit records.
- Policy — stores role-based provisioning policy mappings.
- Notification — stores system notifications.

## Relationships

- One employee can have many workflows.
- One workflow can have many tasks.
- One workflow can have many approvals.
- One workflow can have many audit entries.
