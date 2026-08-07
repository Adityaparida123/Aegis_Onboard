const { z } = require('zod');

const updatePolicySchema = z.object({
  location: z.string().min(2).optional(),
  clearance: z.string().min(2).optional(),
  software: z.array(z.string().min(1)).optional(),
  hardware: z.array(z.string().min(1)).optional(),
  permissions: z.array(z.string().min(1)).optional(),
  approvalRequirements: z.array(z.string().min(1)).optional()
});

module.exports = { updatePolicySchema };
