const { getDashboardStats } = require('../services/dashboardService');
const { successResponse } = require('../utils/response');

async function getDashboard(_req, res, next) {
  try {
    const stats = await getDashboardStats();
    successResponse(res, 200, stats);
  } catch (error) {
    next(error);
  }
}

module.exports = { getDashboard };
