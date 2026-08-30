import { z } from 'zod';
import { paginatedResponseSchema } from '../common/pagination.schema';
import { ProductCategoryTypeEnum } from '../product-category/product-category.schema';

/**
 * A product as the catalog reads it: its category and tax resolved, and the
 * on-hand quantity flattened off the one-row `productStocks` relation.
 */
export const ProductListItemSchema = z.object({
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
  productCategory: z.object({
    id: z.uuid(),
    name: z.string(),
    type: ProductCategoryTypeEnum,
  }),
  tax: z
    .object({ id: z.uuid(), name: z.string(), rate: z.coerce.number() })
    .nullable(),
  stock: z.coerce.number().nullable(),
});

export type ProductListItem = z.infer<typeof ProductListItemSchema>;

export const ProductListItemsResponseSchema = paginatedResponseSchema(
  ProductListItemSchema,
);
export type ProductListItemsResponse = z.infer<
  typeof ProductListItemsResponseSchema
>;

/** The catalog's category filter, on top of the shared pagination params. */
export const ProductQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  type: ProductCategoryTypeEnum.optional(),
});

export type ProductQuery = z.infer<typeof ProductQuerySchema>;
