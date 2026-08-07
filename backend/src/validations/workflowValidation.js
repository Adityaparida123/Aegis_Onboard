const { z } = require('zod');

const createWorkflowSchema = z.object({
  employeeId: z.string().min(1),
  title: z.string().min(3),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.string().min(2).optional(),
  department: z.string().min(2).optional(),
  location: z.string().min(2).optional(),
  clearance: z.string().min(2).optional(),
  joiningDate: z.string().optional()
});

module.exports = { createWorkflowSchema };
