const { createSelfServiceRequest, getSupportRequestById, listOwnSupportRequests } = require('../services/supportRequestService');
const { supportRequestSchema } = require('../validations/chatValidation');
const { successResponse } = require('../utils/response');
const { ValidationError } = require('../utils/errors');

async function createRequest(req, res, next) {
  try {
    const parsed = supportRequestSchema.parse(req.body);
    const request = await createSelfServiceRequest({
      user: req.user,
      category: parsed.category,
      subject: parsed.subject,
      description: parsed.description
    });
    successResponse(res, 201, { request });
  } catch (error) {
    next(error instanceof Error && error.name === 'ZodError' ? new ValidationError('Invalid support request payload', error.errors) : error);
  }
}

async function getRequest(req, res, next) {
  try {
    const request = await getSupportRequestById({ user: req.user, id: req.params.id });
    successResponse(res, 200, { request });
  } catch (error) {
    next(error);
  }
}

async function listRequests(req, res, next) {
  try {
    const requests = await listOwnSupportRequests({ user: req.user });
    successResponse(res, 200, { requests });
  } catch (error) {
    next(error);
  }
}

module.exports = { createRequest, getRequest, listRequests };
