const { z } = require('zod');

const hrisEventSchema = z.object({
  eventType: z.enum(['employee.onboarded', 'employee.updated']).optional(),
  name: z.string().min(2),
  email: z.string().email(),
  role: z.string().min(2),
  department: z.string().min(2),
  location: z.string().min(2).optional(),
  clearance: z.string().min(2).optional(),
  joiningDate: z.string().optional()
});

module.exports = { hrisEventSchema };
