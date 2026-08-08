const { createSupportRequest, findSupportRequestById, listSupportRequestsByEmployee } = require('../repositories/supportRequestRepository');
const { findEmployeeForUser } = require('./employeeContextService');
const { createAuditLog } = require('../repositories/auditRepository');
const { sendNotification } = require('./notificationService');
const { AppError } = require('../utils/errors');

const ELEVATED_ROLES = ['Admin', 'HR'];

async function createSelfServiceRequest({ user, category, subject, description }) {
  const employee = await findEmployeeForUser(user, null);
  const request = await createSupportRequest({
    employeeId: employee ? String(employee._id) : undefined,
    userId: user?.sub ? String(user.sub) : undefined,
    category,
    subject,
    description,
    source: 'self-service',
    status: 'Pending',
    assignedDepartment: category,
    createdByEmail: user?.email
  });

  await createAuditLog({
    workflowId: null,
    employeeId: employee ? String(employee._id) : null,
    actor: user?.email || 'system',
    action: 'support_request_created',
    reason: `${category} self-service request submitted for human review`,
    input: { subject, description, category },
    output: { requestId: request._id, status: request.status },
    result: 'Routed'
  });

  if (employee?.email) {
    await sendNotification(employee.email, `Your ${category} request "${subject}" was submitted and is pending review.`, 'info');
  }

  return request;
}

async function getSupportRequestById({ user, id }) {
  const request = await findSupportRequestById(id);
  if (!request) {
    throw new AppError('Support request not found', 404);
  }

  const employee = await findEmployeeForUser(user, null);
  const isOwner =
    Boolean(employee && request.employeeId && String(request.employeeId) === String(employee._id)) ||
    Boolean(user?.sub && request.userId && String(request.userId) === String(user.sub));

  if (!isOwner && !ELEVATED_ROLES.includes(user?.role)) {
    throw new AppError('You do not have access to this support request', 403);
  }

  return request;
}

async function listOwnSupportRequests({ user }) {
  const employee = await findEmployeeForUser(user, null);
  const employeeId = employee ? String(employee._id) : null;
  return listSupportRequestsByEmployee(employeeId, employeeId ? undefined : String(user.sub));
}

module.exports = { createSelfServiceRequest, getSupportRequestById, listOwnSupportRequests };
