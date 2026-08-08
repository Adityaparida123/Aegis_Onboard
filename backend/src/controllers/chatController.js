const { handleMessage } = require('../services/agents/EmployeeSupportAgent');
const { getChatHistory, getRecentMessages } = require('../services/chatService');
const { chatSchema } = require('../validations/chatValidation');
const { successResponse } = require('../utils/response');
const { ValidationError } = require('../utils/errors');

async function sendMessage(req, res, next) {
  try {
    const parsed = chatSchema.parse(req.body);
    const result = await handleMessage(
      {
        user: req.user,
        message: parsed.message,
        sessionId: parsed.sessionId,
        requestedEmployeeId: parsed.employeeId
      },
      { fetchImpl: globalThis.fetch }
    );
    successResponse(res, 200, result);
  } catch (error) {
    next(error instanceof Error && error.name === 'ZodError' ? new ValidationError('Invalid chat payload', error.errors) : error);
  }
}

async function getHistory(req, res, next) {
  try {
    const sessions = await getChatHistory({ user: req.user, requestedEmployeeId: req.query.employeeId });
    successResponse(res, 200, { sessions });
  } catch (error) {
    next(error);
  }
}

async function getRecent(req, res, next) {
  try {
    const messages = await getRecentMessages({ user: req.user });
    successResponse(res, 200, { messages });
  } catch (error) {
    next(error);
  }
}

module.exports = { sendMessage, getHistory, getRecent };
