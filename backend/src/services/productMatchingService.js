import Product from '../models/Product.js';
import PendingProduct from '../models/PendingProduct.js';
import { logger } from '../utils/logger.js';

const MATCH_CONFIDENCE_THRESHOLD = 0.7;

/**
 * Normalize string for comparison
 */
function normalizeString(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
}

/**
 * Calculate similarity between two strings (simple Levenshtein-based)
 */
function calculateSimilarity(str1, str2) {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);

  if (s1 === s2) return 1.0;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  // Simple substring match
  if (longer.includes(shorter)) return 0.8;

  // Levenshtein distance
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - distance / maxLength;
}

/**
 * Levenshtein distance calculation
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * Match product by barcode/SKU
 */
async function matchByBarcodeOrSku(barcode, sku) {
  const query = { isActive: true };
  const orConditions = [];

  if (barcode) {
    orConditions.push({ barcode: barcode.trim() });
  }
  if (sku) {
    orConditions.push({ sku: sku.trim() });
  }

  if (orConditions.length === 0) return null;

  query.$or = orConditions;
  const product = await Product.findOne(query);
  return product ? { product, confidence: 1.0, method: 'barcode/sku' } : null;
}

/**
 * Match product by name and aliases
 */
async function matchByName(rawName) {
  const normalizedName = normalizeString(rawName);
  const products = await Product.find({ isActive: true }).lean();

  let bestMatch = null;
  let bestConfidence = 0;

  for (const product of products) {
    // Check exact name match
    const nameSimilarity = calculateSimilarity(rawName, product.name);
    if (nameSimilarity > bestConfidence) {
      bestConfidence = nameSimilarity;
      bestMatch = product;
    }

    // Check aliases
    for (const alias of product.aliases || []) {
      const aliasSimilarity = calculateSimilarity(rawName, alias);
      if (aliasSimilarity > bestConfidence) {
        bestConfidence = aliasSimilarity;
        bestMatch = product;
      }
    }
  }

  if (bestConfidence >= MATCH_CONFIDENCE_THRESHOLD) {
    return {
      product: bestMatch,
      confidence: bestConfidence,
      method: 'name/alias',
    };
  }

  return null;
}

/**
 * Match a parsed item to existing product
 */
async function matchProduct(rawName, barcode = null, sku = null) {
  // First try barcode/SKU match (highest confidence)
  if (barcode || sku) {
    const barcodeMatch = await matchByBarcodeOrSku(barcode, sku);
    if (barcodeMatch) {
      logger.info(`Matched product by barcode/SKU: ${rawName} -> ${barcodeMatch.product.name}`);
      return barcodeMatch;
    }
  }

  // Then try name/alias match
  const nameMatch = await matchByName(rawName);
  if (nameMatch) {
    logger.info(`Matched product by name: ${rawName} -> ${nameMatch.product.name} (confidence: ${nameMatch.confidence})`);
    return nameMatch;
  }

  return null;
}

/**
 * Create pending product entry
 */
async function createPendingProduct(rawName, suggestedFields) {
  const pendingProduct = new PendingProduct({
    rawName,
    suggestedFields: {
      name: suggestedFields.name || rawName,
      unitType: suggestedFields.unitType,
      costPrice: suggestedFields.costPrice,
      retailPrice: suggestedFields.retailPrice,
      wholesalePrice: suggestedFields.wholesalePrice,
    },
    status: 'pending',
  });

  await pendingProduct.save();
  logger.info(`Created pending product: ${rawName}`);
  return pendingProduct;
}

export { matchProduct, createPendingProduct, MATCH_CONFIDENCE_THRESHOLD };
