const express = require('express');
const { createRequest, getRequest, listRequests } = require('../controllers/supportRequestController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/request', authenticate, createRequest);
router.get('/request', authenticate, listRequests);
router.get('/request/:id', authenticate, getRequest);

module.exports = router;
