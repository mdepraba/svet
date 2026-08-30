import { z } from 'zod';
import { paginatedResponseSchema } from '../common/pagination.schema';
import { CreateVisitProductAssocSchema } from '../visit-product-assoc/visit-product-assoc.schema';
import { CreateVisitTreatmentAssocSchema } from '../visit-treatment-assoc/visit-treatment-assoc.schema';

export const CreateVisitDetailSchema = z.object({
  visitId: z.uuid('Invalid Visit ID format'),
  patientId: z.uuid('Invalid Patient ID format'),
  vetId: z.uuid('Invalid Vet ID format'),
});

export const UpdateVisitDetailSchema = CreateVisitDetailSchema.partial().extend(
  {
    visitTreatmentAssocs: z.array(CreateVisitTreatmentAssocSchema).optional(),
    visitProductAssocs: z.array(CreateVisitProductAssocSchema).optional(),
  },
);

export type CreateVisitDetail = z.infer<typeof CreateVisitDetailSchema>;
export type UpdateVisitDetail = z.infer<typeof UpdateVisitDetailSchema>;

export const VisitDetailResponseSchema = z.object({
  id: z.uuid(),
  visitId: z.uuid(),
  patientId: z.uuid(),
  vetId: z.uuid(),
  deletedAt: z.coerce.date().nullable(),
});

export type VisitDetailResponse = z.infer<typeof VisitDetailResponseSchema>;

export const VisitDetailListResponseSchema = paginatedResponseSchema(
  VisitDetailResponseSchema,
);
export type VisitDetailListResponse = z.infer<
  typeof VisitDetailListResponseSchema
>;
