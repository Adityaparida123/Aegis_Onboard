const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { mongoUri } = require('./env');

async function connectDatabase() {
  try {
    await mongoose.connect(mongoUri);
    logger.info({ mongoUri }, 'Database connected');
  } catch (error) {
    logger.warn({ error: error.message }, 'Database connection skipped or failed; continuing in dev mode');
  }
}

module.exports = { connectDatabase };
