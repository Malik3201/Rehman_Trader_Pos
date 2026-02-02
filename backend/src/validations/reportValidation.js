const { z } = require('zod');

const getDailySummarySchema = z.object({
  query: z.object({
    date: z.string().optional(), // YYYY-MM-DD format
  }),
});

module.exports = {
  getDailySummarySchema,
};
