const { z } = require('zod');

const chatSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(2000, 'Message is too long'),
  sessionId: z.string().optional(),
  employeeId: z.string().optional()
});

const supportRequestSchema = z.object({
  category: z.enum(['HR', 'IT', 'Finance', 'Security']),
  subject: z.string().trim().min(3, 'Subject is required').max(120),
  description: z.string().trim().min(3, 'Description is required').max(2000)
});

module.exports = { chatSchema, supportRequestSchema };
