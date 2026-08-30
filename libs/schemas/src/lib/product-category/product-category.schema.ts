import { z } from 'zod';
import { paginatedResponseSchema } from '../common/pagination.schema';

export const ProductCategoryTypeEnum = z.enum(['MEDIC', 'NON_MEDIC']);

export const CreateProductCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: ProductCategoryTypeEnum,
  description: z.string().optional().nullable(),
});

export const UpdateProductCategorySchema =
  CreateProductCategorySchema.partial();

export type CreateProductCategory = z.infer<typeof CreateProductCategorySchema>;
export type UpdateProductCategory = z.infer<typeof UpdateProductCategorySchema>;

export const ProductCategoryResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  type: ProductCategoryTypeEnum,
  description: z.string().nullable(),
  deletedAt: z.coerce.date().nullable(),
});

export type ProductCategoryResponse = z.infer<
  typeof ProductCategoryResponseSchema
>;

export const ProductCategoryListResponseSchema = paginatedResponseSchema(
  ProductCategoryResponseSchema,
);
export type ProductCategoryListResponse = z.infer<
  typeof ProductCategoryListResponseSchema
>;
