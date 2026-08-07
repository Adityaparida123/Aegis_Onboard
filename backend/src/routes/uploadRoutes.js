const express = require('express');
const multer = require('multer');
const { uploadOffer } = require('../controllers/uploadController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const storage = multer.memoryStorage();
const upload = multer({ storage });
const router = express.Router();

router.post('/', authenticate, authorize(['Admin', 'HR']), upload.single('file'), uploadOffer);

module.exports = router;
