import { z } from 'zod';
import { paginatedResponseSchema } from '../common/pagination.schema';

/**
 * A patient as the list and chart screens read it: the owner it belongs to,
 * when it was last seen, and how thick its file is. Flattened by the API so
 * the client does not walk `visitDetails[0].visit.visitDate` to print a date.
 */
export const PatientListItemSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  species: z.string(),
  breed: z.string().nullable(),
  sex: z.string().nullable(),
  color: z.string().nullable(),
  dob: z.coerce.date().nullable(),
  ownerId: z.uuid(),
  deletedAt: z.coerce.date().nullable(),
  owner: z.object({
    id: z.uuid(),
    name: z.string(),
    phone: z.string().nullable(),
  }),
  lastVisitAt: z.coerce.date().nullable(),
  recordCount: z.number().int(),
});

export type PatientListItem = z.infer<typeof PatientListItemSchema>;

export const PatientListItemsResponseSchema = paginatedResponseSchema(
  PatientListItemSchema,
);
export type PatientListItemsResponse = z.infer<
  typeof PatientListItemsResponseSchema
>;

/** The patient list's own filter, on top of the shared pagination params. */
export const PatientQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  /** Matched case-insensitively against `patient.species`. */
  species: z.string().optional(),
});

export type PatientQuery = z.infer<typeof PatientQuerySchema>;
