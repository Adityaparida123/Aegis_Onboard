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
async function ensureEmployeeLink(userOrId) {
  const userId = userOrId && typeof userOrId === 'object' ? userOrId.sub || userOrId.id || userOrId._id : userOrId;
  if (!userId) {
    return null;
  }

  const user = await findUserById(userId);
  if (!user) {
    return null;
  }

  if (user.employeeId) {
    const linked = await findEmployeeById(user.employeeId);
    if (linked) {
      if (!linked.userId) {
        await linkEmployeeToUser(linked._id, user._id);
      }
      return linked;
    }
  }

  const byUserId = await findEmployeeByUserId(user._id);
  if (byUserId) {
    await linkUserToEmployee(user._id, byUserId._id);
    return byUserId;
  }

  const byEmail = await findEmployeeByEmail(user.email);
  if (byEmail) {
    await linkEmployeeToUser(byEmail._id, user._id);
    await linkUserToEmployee(user._id, byEmail._id);
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
  return employee;
}

module.exports = { ensureEmployeeLink };
