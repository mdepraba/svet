import { z } from 'zod';
import { paginatedResponseSchema } from '../common/pagination.schema';

export const CreateVisitProductAssocSchema = z.object({
  visitDetailId: z.uuid('Invalid Visit Detail ID format'),
  visitTreatmentAssocId: z
    .uuid('Invalid Visit Treatment Assoc ID format')
    .optional()
    .nullable(),
  productId: z.uuid('Invalid Product ID format'),
  qty: z.number().int().min(1, 'Quantity must be greater than 0'),
});

export const UpdateVisitProductAssocSchema =
  CreateVisitProductAssocSchema.partial();

export type CreateVisitProductAssoc = z.infer<
  typeof CreateVisitProductAssocSchema
>;
export type UpdateVisitProductAssoc = z.infer<
  typeof UpdateVisitProductAssocSchema
>;

export const VisitProductAssocResponseSchema = z.object({
  id: z.uuid(),
  visitDetailId: z.uuid(),
  visitTreatmentAssocId: z.uuid().nullable(),
  productId: z.uuid(),
  qty: z.number().int(),
  deletedAt: z.coerce.date().nullable(),
});

export type VisitProductAssocResponse = z.infer<
  typeof VisitProductAssocResponseSchema
>;

export const VisitProductAssocListResponseSchema = paginatedResponseSchema(
  VisitProductAssocResponseSchema,
);
export type VisitProductAssocListResponse = z.infer<
  typeof VisitProductAssocListResponseSchema
>;
