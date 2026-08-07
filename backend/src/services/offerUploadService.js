const fs = require('fs/promises');
const path = require('path');
const { uploadDir } = require('../config/env');
const { ValidationError } = require('../utils/errors');

async function storeOfferFile(file) {
  if (!file) {
    throw new ValidationError('Offer letter upload is required');
  }

  await fs.mkdir(uploadDir, { recursive: true });
  const fileName = `${Date.now()}-${file.originalname}`;
  const filePath = path.join(uploadDir, fileName);
  await fs.writeFile(filePath, file.buffer);

  return { fileName, filePath, mimeType: file.mimetype };
}

module.exports = { storeOfferFile };
