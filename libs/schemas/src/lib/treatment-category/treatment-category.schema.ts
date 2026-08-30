import { z } from 'zod';
import { paginatedResponseSchema } from '../common/pagination.schema';

export const TreatmentCategoryTypeEnum = z.enum(['MEDIC', 'NON_MEDIC']);

export const CreateTreatmentCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: TreatmentCategoryTypeEnum,
  description: z.string().optional().nullable(),
});

export const UpdateTreatmentCategorySchema =
  CreateTreatmentCategorySchema.partial();

export type CreateTreatmentCategory = z.infer<
  typeof CreateTreatmentCategorySchema
>;
export type UpdateTreatmentCategory = z.infer<
  typeof UpdateTreatmentCategorySchema
>;

export const TreatmentCategoryResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  type: TreatmentCategoryTypeEnum,
  description: z.string().nullable(),
  deletedAt: z.coerce.date().nullable(),
});

export type TreatmentCategoryResponse = z.infer<
  typeof TreatmentCategoryResponseSchema
>;

export const TreatmentCategoryListResponseSchema = paginatedResponseSchema(
  TreatmentCategoryResponseSchema,
);
export type TreatmentCategoryListResponse = z.infer<
  typeof TreatmentCategoryListResponseSchema
>;
