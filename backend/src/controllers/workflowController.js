const { generateWorkflow } = require('../services/workflowEngine');
const { findWorkflowById, listWorkflows } = require('../repositories/workflowRepository');
const { listTasksByWorkflow } = require('../repositories/taskRepository');
const { listApprovalsByWorkflow } = require('../repositories/approvalRepository');
const { createWorkflowSchema } = require('../validations/workflowValidation');
const { successResponse } = require('../utils/response');
const { ValidationError, AppError } = require('../utils/errors');

async function createWorkflow(req, res, next) {
  try {
    const parsed = createWorkflowSchema.parse(req.body);
    const result = await generateWorkflow(parsed, req.user?.email || 'system');
    successResponse(res, 201, result);
  } catch (error) {
    next(error instanceof Error && error.name === 'ZodError' ? new ValidationError('Invalid workflow payload', error.errors) : error);
  }
}

async function getWorkflows(_req, res, next) {
  try {
    const workflows = await listWorkflows();
    successResponse(res, 200, { workflows });
  } catch (error) {
    next(error);
  }
}

async function getWorkflowById(req, res, next) {
  try {
    const workflow = await findWorkflowById(req.params.id);
    if (!workflow) {
      throw new AppError('Workflow not found', 404);
    }
    const tasks = await listTasksByWorkflow(req.params.id);
    const approvals = await listApprovalsByWorkflow(req.params.id);
    successResponse(res, 200, { workflow, tasks, approvals });
  } catch (error) {
    next(error);
  }
}

module.exports = { createWorkflow, getWorkflows, getWorkflowById };
