const { z } = require('zod');

const uploadOfferSchema = z.object({
  file: z.object({
    originalname: z.string(),
    mimetype: z.string().refine(value => value === 'application/pdf', { message: 'Only PDF files are allowed' })
  })
});

module.exports = { uploadOfferSchema };
