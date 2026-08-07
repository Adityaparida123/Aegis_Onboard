const { listPolicies, updatePolicy } = require('../services/policyService');
const { createAuditLog } = require('../repositories/auditRepository');
const { updatePolicySchema } = require('../validations/policyValidation');
const { successResponse } = require('../utils/response');
const { ValidationError, AppError } = require('../utils/errors');

async function getPolicies(_req, res, next) {
  try {
    const policies = await listPolicies();
    successResponse(res, 200, { policies });
  } catch (error) {
    next(error);
  }
}

async function patchPolicy(req, res, next) {
  try {
    const patch = updatePolicySchema.parse(req.body);
    const previous = await listPolicies().then((policies) => policies.find((policy) => String(policy._id) === String(req.params.id)));
    if (!previous) {
      throw new AppError('Policy not found', 404);
    }

    const updated = await updatePolicy(req.params.id, patch);
    await createAuditLog({
      workflowId: null,
      employeeId: null,
      actor: req.user?.email || 'system',
      action: 'policy_updated',
      reason: `Updated access policy for ${updated.role}`,
      input: previous,
      output: updated,
      result: 'Policy updated'
    });

    successResponse(res, 200, { policy: updated });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      next(new ValidationError('Invalid policy payload', error.errors));
      return;
    }
    next(error);
  }
}

module.exports = { getPolicies, patchPolicy };
