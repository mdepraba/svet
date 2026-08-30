import { z } from 'zod';
import { paginatedResponseSchema } from '../common/pagination.schema';

/**
 * A medical record with everything the record log shows in the row and in the
 * expanded summary underneath it: who the patient and owner are, which vet
 * saw them, and what was used.
 */
export const MedicalRecordListItemSchema = z.object({
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

  patient: z.object({
    id: z.uuid(),
    name: z.string(),
    species: z.string(),
    breed: z.string().nullable(),
    owner: z.object({ id: z.uuid(), name: z.string() }),
  }),

  visitDetails: z
    .object({
      id: z.uuid(),
      visitId: z.uuid(),
      vet: z.object({ id: z.uuid(), name: z.string() }),
      visit: z.object({
        id: z.uuid(),
        visitDate: z.coerce.date(),
        status: z.enum(['SCHEDULED', 'ONGOING', 'FINISHED', 'CANCELLED']),
      }),
      visitTreatmentAssocs: z.array(
        z.object({
          id: z.uuid(),
          qty: z.number().int(),
          treatment: z.object({ id: z.uuid(), name: z.string() }),
        }),
      ),
      visitProductAssocs: z.array(
        z.object({
          id: z.uuid(),
          qty: z.number().int(),
          product: z.object({
            id: z.uuid(),
            name: z.string(),
            dispensingUnit: z.string(),
          }),
        }),
      ),
    })
    .nullable(),

  MedicalUsages: z.array(
    z.object({
      id: z.uuid(),
      quantity: z.coerce.number(),
      notes: z.string().nullable(),
      product: z.object({
        id: z.uuid(),
        name: z.string(),
        dispensingUnit: z.string(),
      }),
    }),
  ),
});

export type MedicalRecordListItem = z.infer<typeof MedicalRecordListItemSchema>;

export const MedicalRecordListItemsResponseSchema = paginatedResponseSchema(
  MedicalRecordListItemSchema,
);
export type MedicalRecordListItemsResponse = z.infer<
  typeof MedicalRecordListItemsResponseSchema
>;
