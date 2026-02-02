import { z } from 'zod';

const adjustStockSchema = z.object({
  body: z.object({
    productId: z.string().min(1, 'Product ID is required'),
    qtyChange: z.number().refine((val) => val !== 0, {
      message: 'Quantity change cannot be zero',
    }),
    reason: z.string().optional(),
  }),
});

module.exports = {
  adjustStockSchema,
};
