const { z } = require('zod');

// File upload validation is handled by multer middleware
// This schema is for any additional body fields if needed
const importPurchaseSchema = z.object({
  body: z.object({}).optional(),
});

module.exports = {
  importPurchaseSchema,
};
