import { z } from 'zod';

const createPaymentSchema = z.object({
  body: z.object({
    customerId: z.string().min(1, 'Customer ID is required'),
    amount: z.number().positive('Amount must be positive'),
    method: z.enum(['cash', 'bank', 'other']).default('cash'),
    note: z.string().optional(),
  }),
});

export { createPaymentSchema };
