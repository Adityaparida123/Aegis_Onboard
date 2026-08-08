const { findEmployeeForUser, gatherEmployeeContext, serializeContext } = require('../services/employeeContextService');
const { successResponse } = require('../utils/response');
const { AppError } = require('../utils/errors');

async function getEmployeeContext(req, res, next) {
  try {
    const employee = await findEmployeeForUser(req.user, req.query.employeeId);
    if (!employee) {
      throw new AppError('No verified employee profile linked to this account', 404);
    }
    const context = await gatherEmployeeContext(employee);
    successResponse(res, 200, { context: serializeContext(context) });
  } catch (error) {
    next(error);
  }
}

module.exports = { getEmployeeContext };
