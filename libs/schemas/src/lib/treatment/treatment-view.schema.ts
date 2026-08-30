import { z } from 'zod';
import { paginatedResponseSchema } from '../common/pagination.schema';
import { TreatmentCategoryTypeEnum } from '../treatment-category/treatment-category.schema';

/**
 * A treatment with its default product recipe — the set of products suggested
 * to the vet whenever the service is chosen, and the basis of the recipe cost
 * shown against the gross price.
 */
export const TreatmentRecipeLineSchema = z.object({
  id: z.uuid(),
  treatmentId: z.uuid(),
  productId: z.uuid(),
  qty: z.number().int(),
  product: z.object({
    id: z.uuid(),
    name: z.string(),
    sku: z.string(),
    dispensingUnit: z.string(),
    grossPrice: z.coerce.number(),
  }),
});

export type TreatmentRecipeLine = z.infer<typeof TreatmentRecipeLineSchema>;

export const TreatmentListItemSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  categoryId: z.uuid(),
  isActive: z.boolean(),
  basePrice: z.coerce.number(),
  grossPrice: z.coerce.number(),
  taxId: z.uuid(),
  maxDiscount: z.coerce.number().nullable(),
  deletedAt: z.coerce.date().nullable(),
  treatmentCategory: z.object({
    id: z.uuid(),
    name: z.string(),
    type: TreatmentCategoryTypeEnum,
  }),
  tax: z
    .object({ id: z.uuid(), name: z.string(), rate: z.coerce.number() })
    .nullable(),
  treatmentProductAssocs: z.array(TreatmentRecipeLineSchema),
});

export type TreatmentListItem = z.infer<typeof TreatmentListItemSchema>;

export const TreatmentListItemsResponseSchema = paginatedResponseSchema(
  TreatmentListItemSchema,
);
export type TreatmentListItemsResponse = z.infer<
  typeof TreatmentListItemsResponseSchema
>;

/**
 * The recipe is replaced wholesale rather than patched line by line — the
 * editor always holds the complete set, and a diff-based API would make
 * "removed the last product" indistinguishable from "sent nothing".
 */
export const SaveTreatmentRecipeSchema = z.object({
  lines: z.array(
    z.object({
      productId: z.uuid('Invalid Product ID format'),
      qty: z.number().int().min(1, 'Quantity must be greater than 0'),
    }),
  ),
});

export type SaveTreatmentRecipe = z.infer<typeof SaveTreatmentRecipeSchema>;
