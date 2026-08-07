const express = require('express');
const { getNotifications } = require('../controllers/notificationController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/', authenticate, authorize(['Admin', 'HR', 'IT', 'Finance', 'Security Manager']), getNotifications);

module.exports = router;
