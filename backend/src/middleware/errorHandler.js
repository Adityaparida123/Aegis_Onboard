const logger = require('../utils/logger');
const { errorResponse } = require('../utils/response');
const { AppError } = require('../utils/errors');

function errorHandler(err, req, res, _next) {
  logger.error({ err, path: req.originalUrl, method: req.method }, 'Request failed');

  if (err instanceof AppError) {
    return errorResponse(res, err);
  }

  if (err.name === 'CastError') {
    return errorResponse(res, new AppError('Invalid identifier', 400));
  }

  if (err.name === 'MongoServerError' && err.code === 11000) {
    return errorResponse(res, new AppError('Duplicate value for a unique field', 409));
  }

  return errorResponse(res, { message: 'Internal Server Error', statusCode: 500 });
}

module.exports = errorHandler;
