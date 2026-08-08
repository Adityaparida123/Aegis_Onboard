const { listChatSessionsByEmployee, listMessagesBySession, listMessagesByEmployee } = require('../repositories/chatRepository');
const { findEmployeeForUser } = require('./employeeContextService');
const { AppError } = require('../utils/errors');

async function getChatHistory({ user, requestedEmployeeId }) {
  const elevated = ['Admin', 'HR'].includes(user?.role);
  const employee = requestedEmployeeId && elevated ? await findEmployeeForUser(user, requestedEmployeeId) : await findEmployeeForUser(user, null);
  const employeeId = employee ? String(employee._id) : null;

  const sessions = await listChatSessionsByEmployee(employeeId, employeeId ? undefined : String(user.sub));
  const enriched = [];
  for (const session of sessions) {
    const messages = await listMessagesBySession(session._id);
    enriched.push({ ...session, messages });
  }
  return enriched;
}

async function getRecentMessages({ user }) {
  const employee = await findEmployeeForUser(user, null);
  const employeeId = employee ? String(employee._id) : null;
  return listMessagesByEmployee(employeeId, employeeId ? undefined : String(user.sub), 100);
}

async function getSessionMessages({ user, sessionId }) {
  const session = (await getChatHistory({ user })).find((entry) => String(entry._id) === String(sessionId));
  if (!session) {
    throw new AppError('Chat session not found', 404);
  }
  return session.messages;
}

module.exports = { getChatHistory, getRecentMessages, getSessionMessages };
