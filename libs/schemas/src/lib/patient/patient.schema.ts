import { z } from 'zod';
import { paginatedResponseSchema } from '../common/pagination.schema';

export const CreatePatientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  species: z.string().min(1, 'Species is required'),
  breed: z.string().optional().nullable(),
  sex: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  dob: z
    .string()
    .refine((val) => val === null || !Number.isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    })
    .transform((val) => (val ? new Date(val) : null)),
  ownerId: z.uuid('Invalid Owner ID format'),
});

export const UpdatePatientSchema = CreatePatientSchema.partial();

export type CreatePatient = z.infer<typeof CreatePatientSchema>;
export type UpdatePatient = z.infer<typeof UpdatePatientSchema>;

export const PatientResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  species: z.string(),
  breed: z.string().nullable(),
  sex: z.string().nullable(),
  color: z.string().nullable(),
  dob: z.coerce.date().nullable(),
  ownerId: z.uuid(),
  deletedAt: z.coerce.date().nullable(),
});

export type PatientResponse = z.infer<typeof PatientResponseSchema>;

export const PatientListResponseSchema = paginatedResponseSchema(
  PatientResponseSchema,
);
export type PatientListResponse = z.infer<typeof PatientListResponseSchema>;
