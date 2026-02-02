import { generateWhatsAppShare } from '../services/whatsappShareService.js';
import { successResponse } from '../utils/apiResponse.js';

async function getWhatsAppShareHandler(req, res, next) {
  try {
    // Get base URL from request
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    const shareData = await generateWhatsAppShare(req.validated.params.id, baseUrl);
    return res.json(successResponse(shareData, 'WhatsApp share data generated successfully'));
  } catch (error) {
    return next(error);
  }
}

export { getWhatsAppShareHandler };
