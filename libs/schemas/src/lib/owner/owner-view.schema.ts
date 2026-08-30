import { z } from 'zod';
import { paginatedResponseSchema } from '../common/pagination.schema';

/** An owner with the two things the list adds: their pets and their last visit. */
export const OwnerListItemSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  deletedAt: z.coerce.date().nullable(),
  patients: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      species: z.string(),
      breed: z.string().nullable(),
      dob: z.coerce.date().nullable(),
    }),
  ),
  lastVisitAt: z.coerce.date().nullable(),
});

export type OwnerListItem = z.infer<typeof OwnerListItemSchema>;

export const OwnerListItemsResponseSchema =
  paginatedResponseSchema(OwnerListItemSchema);
export type OwnerListItemsResponse = z.infer<
  typeof OwnerListItemsResponseSchema
>;

/** The owner detail screen adds their visit and invoice history. */
export const OwnerDetailSchema = OwnerListItemSchema.extend({
  visits: z.array(
    z.object({
      id: z.uuid(),
      visitDate: z.coerce.date(),
      status: z.enum(['SCHEDULED', 'ONGOING', 'FINISHED', 'CANCELLED']),
      visitType: z.enum(['MEDIC', 'NON_MEDIC']),
      patients: z.array(z.object({ id: z.uuid(), name: z.string() })),
    }),
  ),
  invoices: z.array(
    z.object({
      id: z.uuid(),
      identifier: z.string(),
      status: z.enum(['PENDING', 'PAID', 'CANCELLED']),
      totalGross: z.coerce.number(),
      createdAt: z.coerce.date(),
      /** Null for a walk-in retail sale. */
      visitId: z.uuid().nullable(),
    }),
  ),
});

export type OwnerDetail = z.infer<typeof OwnerDetailSchema>;
