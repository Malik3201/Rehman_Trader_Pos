import { z } from 'zod';

const retailSaleSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          productId: z.string().min(1, 'Product ID is required'),
          qty: z.number().positive('Quantity must be positive'),
        })
      )
      .min(1, 'At least one item is required'),
    paymentReceived: z.number().min(0).default(0),
    paymentMethod: z.enum(['cash', 'bank', 'other']).default('cash'),
    discount: z.number().min(0).optional(),
    notes: z.string().optional(),
  }),
});

const wholesaleSaleSchema = z.object({
  body: z.object({
    customerId: z.string().min(1, 'Customer ID is required'),
    items: z
      .array(
        z.object({
          productId: z.string().min(1, 'Product ID is required'),
          qty: z.number().positive('Quantity must be positive'),
          unitPrice: z.number().positive().optional(),
        })
      )
      .min(1, 'At least one item is required'),
    paymentReceived: z.number().min(0).default(0),
    paymentMethod: z.enum(['cash', 'bank', 'other']).default('cash'),
    discount: z.number().min(0).optional(),
    notes: z.string().optional(),
  }),
});

const getSalesSchema = z.object({
  query: z.object({
    type: z.enum(['retail', 'wholesale']).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    customerId: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

const getSaleByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Sale ID is required'),
  }),
});

const getInvoicePdfSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Sale ID is required'),
  }),
});

const getWhatsAppShareSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Sale ID is required'),
  }),
});

export {
  retailSaleSchema,
  wholesaleSaleSchema,
  getSalesSchema,
  getSaleByIdSchema,
  getInvoicePdfSchema,
  getWhatsAppShareSchema,
};
