const { registerUser, loginUser } = require('../services/authService');
const { successResponse } = require('../utils/response');
const { registerSchema, loginSchema } = require('../validations/authValidation');
const { ValidationError } = require('../utils/errors');

async function register(req, res, next) {
  try {
    const parsed = registerSchema.parse(req.body);
    const result = await registerUser(parsed);
    successResponse(res, 201, result);
  } catch (error) {
    next(error instanceof Error && error.name === 'ZodError' ? new ValidationError('Invalid registration payload', error.errors) : error);
  }
}

async function login(req, res, next) {
  try {
    const parsed = loginSchema.parse(req.body);
    const result = await loginUser(parsed);
    successResponse(res, 200, result);
  } catch (error) {
    next(error instanceof Error && error.name === 'ZodError' ? new ValidationError('Invalid login payload', error.errors) : error);
  }
}

module.exports = { register, login };
