const { createNotification } = require('../repositories/notificationRepository');

async function sendNotification(recipient, message, type = 'info') {
  return createNotification({ recipient, message, type });
}

module.exports = { sendNotification };
