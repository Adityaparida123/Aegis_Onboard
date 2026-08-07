function successResponse(res, statusCode = 200, data = {}) {
  return res.status(statusCode).json({ success: true, data });
}

function errorResponse(res, error) {
  const statusCode = error.statusCode || 500;
  const payload = {
    success: false,
    error: error.message || 'Internal Server Error'
  };

  if (error.details) {
    payload.details = error.details;
  }

  return res.status(statusCode).json(payload);
}

module.exports = { successResponse, errorResponse };
