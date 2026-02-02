import { z } from 'zod';

// File upload validation is handled by multer middleware
// This schema is for any additional body fields if needed
const importPurchaseSchema = z.object({
  body: z.object({}).optional(),
});

export { importPurchaseSchema };
