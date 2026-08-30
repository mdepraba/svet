import { z } from 'zod';
import { paginatedResponseSchema } from '../common/pagination.schema';

export const CreateProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  categoryId: z.uuid('Invalid Category ID format'),
  purchaseUnit: z.string().min(1, 'Purchase unit is required'),
  dispensingUnit: z.string().min(1, 'Dispensing unit is required'),
  conversionFactor: z
    .number()
    .positive('Conversion factor must be greater than 0'),
  basePrice: z.number().nonnegative('Base price cannot be negative'),
  grossPrice: z.number().nonnegative('Gross price cannot be negative'),
  taxId: z.uuid('Invalid Tax ID format'),
  maxDiscount: z
    .number()
    .nonnegative('Max discount cannot be negative')
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export type CreateProduct = z.infer<typeof CreateProductSchema>;
export type UpdateProduct = z.infer<typeof UpdateProductSchema>;

export const ProductResponseSchema = z.object({
  id: z.uuid(),
  sku: z.string(),
  name: z.string(),
  categoryId: z.uuid(),
  purchaseUnit: z.string(),
  dispensingUnit: z.string(),
  conversionFactor: z.coerce.number(),
  basePrice: z.coerce.number(),
  grossPrice: z.coerce.number(),
  taxId: z.uuid(),
  maxDiscount: z.coerce.number().nullable(),
  isActive: z.boolean(),
  deletedAt: z.coerce.date().nullable(),
});

export type ProductResponse = z.infer<typeof ProductResponseSchema>;

export const ProductListResponseSchema = paginatedResponseSchema(
  ProductResponseSchema,
);
export type ProductListResponse = z.infer<typeof ProductListResponseSchema>;
