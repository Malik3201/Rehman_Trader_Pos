import { z } from 'zod';

const getPurchasesSchema = z.object({
  query: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

const getPurchaseByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Purchase ID is required'),
  }),
});

export { getPurchasesSchema, getPurchaseByIdSchema };
