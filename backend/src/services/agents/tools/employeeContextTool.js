const { findEmployeeForUser, gatherEmployeeContext } = require('../../employeeContextService');

async function loadEmployeeContext(user, requestedEmployeeId) {
  const employee = await findEmployeeForUser(user, requestedEmployeeId);
  if (!employee) {
    return { employee: null, context: null };
  }
  const context = await gatherEmployeeContext(employee);
  return { employee, context };
}

module.exports = { loadEmployeeContext };
