const dotenv = require('dotenv');

dotenv.config();

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:4000'];

module.exports = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aegis',
  uploadDir: process.env.UPLOAD_DIR || './tmp/uploads',
  supportRouteEmails: {
    HR: process.env.SUPPORT_HR_EMAIL || 'hr@aegis.demo',
    IT: process.env.SUPPORT_IT_EMAIL || 'it@aegis.demo',
    Finance: process.env.SUPPORT_FINANCE_EMAIL || 'finance@aegis.demo',
    Security: process.env.SUPPORT_SECURITY_EMAIL || 'security@aegis.demo'
  },
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : DEFAULT_ALLOWED_ORIGINS
};
