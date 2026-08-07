const { listNotifications } = require('../repositories/notificationRepository');
const { successResponse } = require('../utils/response');

async function getNotifications(req, res, next) {
  try {
    const notifications = await listNotifications(req.user?.email);
    successResponse(res, 200, { notifications });
  } catch (error) {
    next(error);
  }
}

module.exports = { getNotifications };
