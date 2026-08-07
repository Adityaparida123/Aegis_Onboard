const express = require('express');
const { ingestHrisEvent } = require('../controllers/hrisController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.post('/webhook', authenticate, authorize(['Admin', 'HR', 'IT', 'Finance', 'Security Manager']), ingestHrisEvent);

module.exports = router;
