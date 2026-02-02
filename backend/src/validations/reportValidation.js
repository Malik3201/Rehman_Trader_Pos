import { z } from 'zod';

const getDailySummarySchema = z.object({
  query: z.object({
    date: z.string().optional(), // YYYY-MM-DD format
  }),
});

export { getDailySummarySchema };
