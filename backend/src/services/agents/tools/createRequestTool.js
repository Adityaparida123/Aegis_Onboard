const { createSupportRequest } = require('../../../repositories/supportRequestRepository');
const { sendNotification } = require('../../notificationService');
const { createAuditLog } = require('../../../repositories/auditRepository');
const { supportRouteEmails } = require('../../../config/env');

const CATEGORY_DEPARTMENT = {
  HR: 'HR',
  IT: 'IT',
  Finance: 'Finance',
  Security: 'Security'
};

function categoryToDepartment(category) {
  return CATEGORY_DEPARTMENT[category] || 'HR';
}

async function createRequestTool({ user, employee, category, subject, description, source = 'chat' }) {
  const normalizedCategory = CATEGORY_DEPARTMENT[category] ? category : 'HR';
  const assignedDepartment = categoryToDepartment(normalizedCategory);
  const employeeId = employee ? String(employee._id) : null;

  const request = await createSupportRequest({
    employeeId,
    userId: user?.sub ? String(user.sub) : undefined,
    category: normalizedCategory,
    subject,
    description,
    source,
    status: 'Pending',
    assignedDepartment,
    createdByEmail: user?.email || employee?.email || 'system'
  });

  const departmentEmail = supportRouteEmails[normalizedCategory];
  if (departmentEmail) {
    await sendNotification(
      departmentEmail,
      `Support request #${String(request._id).slice(-6)}: ${subject} (${normalizedCategory}) from ${user?.email || employee?.email || 'employee'}`,
      'warning'
    );
  }
  if (employee?.email) {
    await sendNotification(employee.email, `Your ${normalizedCategory} request "${subject}" was submitted and is pending review.`, 'info');
  }

  await createAuditLog({
    workflowId: null,
    employeeId,
    actor: user?.email || employee?.email || 'system',
    action: 'support_request_created',
    reason: `${normalizedCategory} request routed to ${assignedDepartment} for human review`,
    input: { subject, description, category: normalizedCategory },
    output: { requestId: request._id, status: request.status },
    result: 'Routed for approval'
  });

  return request;
}

module.exports = { createRequestTool, categoryToDepartment, CATEGORY_DEPARTMENT };
