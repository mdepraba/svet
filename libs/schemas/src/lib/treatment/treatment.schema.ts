import { z } from 'zod';
import { paginatedResponseSchema } from '../common/pagination.schema';

export const CreateTreatmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  categoryId: z.uuid('Invalid Category ID format'),
  isActive: z.boolean().optional(),
  basePrice: z.number().nonnegative('Base price cannot be negative'),
  grossPrice: z.number().nonnegative('Gross price cannot be negative'),
  taxId: z.uuid('Invalid Tax ID format'),
  maxDiscount: z
    .number()
    .nonnegative('Max discount cannot be negative')
    .optional()
    .nullable(),
});

export const UpdateTreatmentSchema = CreateTreatmentSchema.partial();

export type CreateTreatment = z.infer<typeof CreateTreatmentSchema>;
export type UpdateTreatment = z.infer<typeof UpdateTreatmentSchema>;

export const TreatmentResponseSchema = z.object({
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
});

export type TreatmentResponse = z.infer<typeof TreatmentResponseSchema>;

export const TreatmentListResponseSchema = paginatedResponseSchema(
  TreatmentResponseSchema,
);
export type TreatmentListResponse = z.infer<typeof TreatmentListResponseSchema>;
