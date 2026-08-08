const express = require('express');
const { sendMessage, getHistory, getRecent } = require('../controllers/chatController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/', authenticate, sendMessage);
router.get('/history', authenticate, getHistory);
router.get('/recent', authenticate, getRecent);

module.exports = router;
