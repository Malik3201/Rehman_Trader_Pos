import PurchaseDraft from '../models/PurchaseDraft.js';

/**
 * Get purchase drafts with filters
 */
async function getPurchaseDrafts(filters = {}) {
  const { status, page = 1, limit = 20 } = filters;

  const query = {};
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const [drafts, total] = await Promise.all([
    PurchaseDraft.find(query)
      .populate('items.matchedProductId', 'name unitType')
      .populate('items.pendingProductId', 'rawName suggestedFields')
      .populate('createdBy', 'name phone')
      .populate('approvedBy', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    PurchaseDraft.countDocuments(query),
  ]);

  return {
    drafts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get purchase draft by ID
 */
async function getPurchaseDraftById(draftId) {
  const draft = await PurchaseDraft.findById(draftId)
    .populate('items.matchedProductId', 'name unitType barcode sku')
    .populate('items.pendingProductId', 'rawName suggestedFields')
    .populate('createdBy', 'name phone')
    .populate('approvedBy', 'name phone')
    .lean();

  if (!draft) {
    const err = new Error('Purchase draft not found');
    err.statusCode = 404;
    err.errorCode = 'DRAFT_NOT_FOUND';
    throw err;
  }

  return draft;
}

export { getPurchaseDrafts, getPurchaseDraftById };
