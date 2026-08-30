import { z } from 'zod';
import { paginatedResponseSchema } from '../common/pagination.schema';

export const CreateVisitTreatmentAssocSchema = z.object({
  visitDetailId: z.uuid('Invalid Visit Detail ID format'),
  treatmentId: z.uuid('Invalid Treatment ID format'),
  qty: z.number().int().min(1, 'Quantity must be greater than 0'),
});

export const UpdateVisitTreatmentAssocSchema =
  CreateVisitTreatmentAssocSchema.partial();

export type CreateVisitTreatmentAssoc = z.infer<
  typeof CreateVisitTreatmentAssocSchema
>;
export type UpdateVisitTreatmentAssoc = z.infer<
  typeof UpdateVisitTreatmentAssocSchema
>;

export const VisitTreatmentAssocResponseSchema = z.object({
  id: z.uuid(),
  visitDetailId: z.uuid(),
  treatmentId: z.uuid(),
  qty: z.number().int(),
  deletedAt: z.coerce.date().nullable(),
});

export type VisitTreatmentAssocResponse = z.infer<
  typeof VisitTreatmentAssocResponseSchema
>;

export const VisitTreatmentAssocListResponseSchema = paginatedResponseSchema(
  VisitTreatmentAssocResponseSchema,
);
export type VisitTreatmentAssocListResponse = z.infer<
  typeof VisitTreatmentAssocListResponseSchema
>;
