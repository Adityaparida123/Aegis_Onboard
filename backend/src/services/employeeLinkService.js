const { findUserById, linkUserToEmployee } = require('../repositories/userRepository');
const {
  createEmployee,
  findEmployeeById,
  findEmployeeByEmail,
  findEmployeeByUserId,
  linkEmployeeToUser
} = require('../repositories/employeeRepository');

/**
 * Resolves the Employee record that belongs to an authenticated user.
 *
 * Identity chain:
 *   1. User.employeeId  (direct link established at register/login)
 *   2. Employee.userId  (reverse link on the employee record)
 *   3. Employee.email   (verified email match, e.g. self-serve ingestion)
 *
 * If no employee exists yet, a minimal Draft profile is created and linked so
 * self-service flows always resolve a profile. Returns null only when the
 * user record itself cannot be found (e.g. a stale token).
 */
function logEmployeeResolution(user, employee, step, extra) {
  const detail = Object.assign({ step }, extra || {});
  if (employee) {
    detail.employeeId = String(employee._id);
  }
  console.log(
    JSON.stringify({
      diagnostic: 'employee_link_resolution',
      userId: user ? String(user._id) : null,
      email: user ? user.email : null,
      role: user ? user.role : null,
      ...detail
    })
  );
}

async function ensureEmployeeLink(userOrId) {
  const userId = userOrId && typeof userOrId === 'object' ? userOrId.sub || userOrId.id || userOrId._id : userOrId;
  if (!userId) {
    console.log(JSON.stringify({ diagnostic: 'employee_link_resolution', step: 'no_user_id' }));
    return null;
  }

  const user = await findUserById(userId);
  if (!user) {
    console.log(JSON.stringify({ diagnostic: 'employee_link_resolution', step: 'user_not_found', userId: String(userId) }));
    return null;
  }

  if (user.employeeId) {
    const linked = await findEmployeeById(user.employeeId);
    if (linked) {
      if (!linked.userId) {
        await linkEmployeeToUser(linked._id, user._id);
      }
      logEmployeeResolution(user, linked, 'via_user_employee_id', { userEmployeeId: String(user.employeeId) });
      return linked;
    }
  }

  const byUserId = await findEmployeeByUserId(user._id);
  if (byUserId) {
    await linkUserToEmployee(user._id, byUserId._id);
    logEmployeeResolution(user, byUserId, 'via_employee_user_id');
    return byUserId;
  }

  const byEmail = await findEmployeeByEmail(user.email);
  if (byEmail) {
    await linkEmployeeToUser(byEmail._id, user._id);
    await linkUserToEmployee(user._id, byEmail._id);
    logEmployeeResolution(user, byEmail, 'via_email_match');
    return byEmail;
  }

  const employee = await createEmployee({
    name: user.name,
    email: user.email,
    role: user.role || 'HR',
    department: user.department || 'HR',
    status: 'Draft',
    userId: user._id
  });

  await linkUserToEmployee(user._id, employee._id);
  logEmployeeResolution(user, employee, 'created_draft', {
    reason: 'no_user_employeeId_and_no_employee_by_userId_or_email'
  });
  return employee;
}

module.exports = { ensureEmployeeLink };
