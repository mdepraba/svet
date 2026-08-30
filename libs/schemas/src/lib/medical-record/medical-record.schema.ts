import { z } from 'zod';
import { paginatedResponseSchema } from '../common/pagination.schema';

export const CreateMedicalRecordSchema = z.object({
  visitDetailId: z.uuid('Invalid Visit Detail ID format'),
  patientId: z.uuid('Invalid Patient ID format'),
  anamnesis: z.string().optional().nullable(),
  temperature: z.number().optional().nullable(),
  pulse: z.number().int().nonnegative().optional().nullable(),
  respiration: z.number().int().nonnegative().optional().nullable(),
  weight: z.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
  diagnosis: z.string().optional().nullable(),
  treatment: z.string().optional().nullable(),
});

export const UpdateMedicalRecordSchema = CreateMedicalRecordSchema.partial();

export type CreateMedicalRecord = z.infer<typeof CreateMedicalRecordSchema>;
export type UpdateMedicalRecord = z.infer<typeof UpdateMedicalRecordSchema>;

export const MedicalRecordResponseSchema = z.object({
  id: z.uuid(),
  visitDetailId: z.uuid(),
  patientId: z.uuid(),
  anamnesis: z.string().nullable(),
  temperature: z.number().nullable(),
  pulse: z.number().int().nullable(),
  respiration: z.number().int().nullable(),
  weight: z.number().nullable(),
  notes: z.string().nullable(),
  diagnosis: z.string().nullable(),
  treatment: z.string().nullable(),
  deletedAt: z.coerce.date().nullable(),
});

export type MedicalRecordResponse = z.infer<typeof MedicalRecordResponseSchema>;

export const MedicalRecordListResponseSchema = paginatedResponseSchema(
  MedicalRecordResponseSchema,
);
export type MedicalRecordListResponse = z.infer<
  typeof MedicalRecordListResponseSchema
>;
