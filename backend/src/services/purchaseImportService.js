import fs from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { extractTextFromImage, validateImageFile } from './ocrService.js';
import { parseReceiptText } from './aiProvider.js';
import { matchProduct, createPendingProduct } from './productMatchingService.js';
import PurchaseDraft from '../models/PurchaseDraft.js';

/**
 * Process uploaded receipt image and create purchase draft
 */
async function importPurchaseFromImage(file, userId) {
  // Validate file
  await validateImageFile(file);

  // Ensure upload directory exists
  const uploadDir = path.resolve(env.UPLOAD_DIR);
  await fs.mkdir(uploadDir, { recursive: true });

  // Save file temporarily
  const fileExt = path.extname(file.originalname);
  const fileName = `${nanoid()}_${Date.now()}${fileExt}`;
  const filePath = path.join(uploadDir, fileName);

  await fs.writeFile(filePath, file.buffer);

  try {
    // Extract text using OCR (or use placeholder if disabled)
    let rawText;
    try {
      rawText = await extractTextFromImage(filePath);
    } catch (ocrError) {
      if (ocrError.errorCode === 'OCR_NOT_CONFIGURED') {
        // For development/testing: use placeholder text
        rawText = `PLACEHOLDER RECEIPT TEXT\nSupplier: Test Supplier\nItem 1: Product A - 10 pcs @ 25.00 = 250.00\nItem 2: Product B - 5 kg @ 50.00 = 250.00\nTotal: 500.00`;
        logger.warn('OCR not configured, using placeholder text');
      } else {
        throw ocrError;
      }
    }

    // Parse with AI
    const parsedData = await parseReceiptText(rawText);

    // Process items and match products
    const draftItems = [];
    const pendingProducts = [];

    for (const item of parsedData.items || []) {
      const rawName = item.name || item.rawName || 'Unknown Product';
      const qty = parseFloat(item.qty) || 0;
      const unit = normalizeUnit(item.unit || 'pcs');
      const unitCost = parseFloat(item.unitCost) || 0;
      const lineTotal = item.lineTotal ? parseFloat(item.lineTotal) : qty * unitCost;

      // Try to match product
      const match = await matchProduct(rawName, item.barcode, item.sku);

      if (match && match.confidence >= 0.7) {
        // Matched product
        draftItems.push({
          rawName,
          qty,
          unit,
          unitCost,
          lineTotal,
          matchedProductId: match.product._id,
          confidence: match.confidence,
          requiresApproval: false,
        });
      } else {
        // No match - create pending product
        const pendingProduct = await createPendingProduct(rawName, {
          name: rawName,
          unitType: unit,
          costPrice: unitCost,
          retailPrice: unitCost * 1.5, // Estimate
          wholesalePrice: unitCost * 1.3, // Estimate
        });

        pendingProducts.push(pendingProduct);

        draftItems.push({
          rawName,
          qty,
          unit,
          unitCost,
          lineTotal,
          matchedProductId: null,
          confidence: match ? match.confidence : 0,
          pendingProductId: pendingProduct._id,
          requiresApproval: true,
        });
      }
    }

    // Create purchase draft
    const draft = new PurchaseDraft({
      supplierNameRaw: parsedData.supplier || null,
      rawText,
      imagePath: filePath,
      items: draftItems,
      status: 'draft',
      createdBy: userId,
    });

    await draft.save();

    logger.info(`Created purchase draft ${draft._id} with ${draftItems.length} items, ${pendingProducts.length} pending products`);

    // Populate draft for response
    const populatedDraft = await PurchaseDraft.findById(draft._id)
      .populate('items.matchedProductId', 'name unitType')
      .populate('items.pendingProductId', 'rawName suggestedFields')
      .populate('createdBy', 'name phone')
      .lean();

    return populatedDraft;
  } catch (error) {
    // Clean up file on error
    try {
      await fs.unlink(filePath);
    } catch (unlinkError) {
      logger.error('Error cleaning up file', unlinkError);
    }
    throw error;
  }
}

/**
 * Normalize unit type
 */
function normalizeUnit(unit) {
  const normalized = unit.toLowerCase().trim();
  const unitMap = {
    pcs: 'pcs',
    piece: 'pcs',
    pieces: 'pcs',
    kg: 'kg',
    kilogram: 'kg',
    kilograms: 'kg',
    g: 'kg', // Will be converted
    gram: 'kg',
    grams: 'kg',
    pack: 'pack',
    packs: 'pack',
    carton: 'carton',
    cartons: 'carton',
    case: 'case',
    cases: 'case',
    liter: 'kg',
    l: 'kg',
    litre: 'kg',
    litres: 'kg',
  };

  return unitMap[normalized] || 'pcs';
}

export { importPurchaseFromImage };
