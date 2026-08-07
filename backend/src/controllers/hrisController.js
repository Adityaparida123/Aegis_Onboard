const { hrisEventSchema } = require('../validations/hrisValidation');
const { generateWorkflow } = require('../services/workflowEngine');
const { successResponse } = require('../utils/response');
const { ValidationError } = require('../utils/errors');

async function ingestHrisEvent(req, res, next) {
  try {
    const parsed = hrisEventSchema.parse(req.body);
    const { eventType, ...profile } = parsed;
    const result = await generateWorkflow(profile, req.user?.email || 'hris-sync');
    successResponse(res, 201, {
      eventType: eventType || 'employee.onboarded',
      acknowledged: true,
      ...result
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      next(new ValidationError('Invalid HRIS payload', error.errors));
      return;
    }
    next(error);
  }
}

module.exports = { ingestHrisEvent };
