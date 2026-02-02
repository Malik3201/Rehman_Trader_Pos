import { z } from 'zod';

const getPurchaseDraftsSchema = z.object({
  query: z.object({
    status: z.enum(['draft', 'approved', 'rejected']).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

const getPurchaseDraftByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Draft ID is required'),
  }),
});

const approvePurchaseDraftSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Draft ID is required'),
  }),
  body: z.object({
    mappingDecisions: z
      .array(
        z.object({
          action: z.enum(['use_existing', 'create_new', 'merge_pending']),
          productId: z.string().optional(),
          productFields: z
            .object({
              name: z.string().optional(),
              unitType: z.enum(['pcs', 'kg', 'pack', 'carton', 'case']).optional(),
              costPrice: z.number().min(0).optional(),
              retailPrice: z.number().min(0).optional(),
              wholesalePrice: z.number().min(0).optional(),
            })
            .optional(),
          pendingProductId: z.string().optional(),
        })
      )
      .min(1, 'At least one mapping decision is required'),
  }),
});

export {
  getPurchaseDraftsSchema,
  getPurchaseDraftByIdSchema,
  approvePurchaseDraftSchema,
};
