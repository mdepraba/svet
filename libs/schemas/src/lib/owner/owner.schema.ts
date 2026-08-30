import { z } from 'zod';
import { paginatedResponseSchema } from '../common/pagination.schema';

export const CreateOwnerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Invalid email format').optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

export const UpdateOwnerSchema = CreateOwnerSchema.partial();

export type CreateOwner = z.infer<typeof CreateOwnerSchema>;
export type UpdateOwner = z.infer<typeof UpdateOwnerSchema>;

export const OwnerResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  deletedAt: z.coerce.date().nullable(),
  patients: z.array(z.object({ id: z.uuid(), name: z.string() })).optional(),
});

export type OwnerResponse = z.infer<typeof OwnerResponseSchema>;

export const OwnerListResponseSchema =
  paginatedResponseSchema(OwnerResponseSchema);
export type OwnerListResponse = z.infer<typeof OwnerListResponseSchema>;
