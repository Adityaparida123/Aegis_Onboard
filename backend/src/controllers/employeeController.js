const { listEmployees, findEmployeeById } = require('../repositories/employeeRepository');
const { successResponse } = require('../utils/response');

async function getEmployees(_req, res, next) {
  try {
    const employees = await listEmployees();
    successResponse(res, 200, { employees });
  } catch (error) {
    next(error);
  }
}

async function getEmployeeById(req, res, next) {
  try {
    const employee = await findEmployeeById(req.params.id);
    successResponse(res, 200, { employee });
  } catch (error) {
    next(error);
  }
}

module.exports = { getEmployees, getEmployeeById };
