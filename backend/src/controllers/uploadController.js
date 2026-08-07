const { storeOfferFile } = require('../services/offerUploadService');
const { extractEmployeeProfile } = require('../services/documentExtractionService');
const { generateWorkflow } = require('../services/workflowEngine');
const { successResponse } = require('../utils/response');

async function uploadOffer(req, res, next) {
  try {
    const upload = await storeOfferFile(req.file);
    const profile = await extractEmployeeProfile(upload.filePath);
    const result = await generateWorkflow(profile, req.user?.email || 'hr');
    successResponse(res, 201, { upload, profile, ...result });
  } catch (error) {
    next(error);
  }
}

module.exports = { uploadOffer };
