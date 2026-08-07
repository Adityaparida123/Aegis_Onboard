const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aegis',
  uploadDir: process.env.UPLOAD_DIR || './tmp/uploads'
};
