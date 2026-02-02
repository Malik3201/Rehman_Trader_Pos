import { z } from 'zod';

const getCustomerLedgerSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Customer ID is required'),
  }),
  query: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
  }),
});

export { getCustomerLedgerSchema };
