const dotenv = require('dotenv');

dotenv.config();

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:4000'];

module.exports = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aegis',
  uploadDir: process.env.UPLOAD_DIR || './tmp/uploads',
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : DEFAULT_ALLOWED_ORIGINS
};
