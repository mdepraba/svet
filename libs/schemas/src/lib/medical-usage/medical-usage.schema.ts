import { z } from 'zod';
import { paginatedResponseSchema } from '../common/pagination.schema';

export const CreateMedicalUsageSchema = z.object({
  medicalRecordId: z.uuid('Invalid Medical Record ID format'),
  productId: z.uuid('Invalid Product ID format'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  notes: z.string().optional().nullable(),
});

export const UpdateMedicalUsageSchema = CreateMedicalUsageSchema.partial();

export type CreateMedicalUsage = z.infer<typeof CreateMedicalUsageSchema>;
export type UpdateMedicalUsage = z.infer<typeof UpdateMedicalUsageSchema>;

export const MedicalUsageResponseSchema = z.object({
  id: z.uuid(),
  medicalRecordId: z.uuid(),
  productId: z.uuid(),
  quantity: z.coerce.number(),
  notes: z.string().nullable(),
  deletedAt: z.coerce.date().nullable(),
});

export type MedicalUsageResponse = z.infer<typeof MedicalUsageResponseSchema>;

export const MedicalUsageListResponseSchema = paginatedResponseSchema(
  MedicalUsageResponseSchema,
);
export type MedicalUsageListResponse = z.infer<
  typeof MedicalUsageListResponseSchema
>;
