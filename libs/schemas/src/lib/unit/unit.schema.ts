import { z } from 'zod';
import { paginatedResponseSchema } from '../common/pagination.schema';

export const CreateUnitSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  name: z.string().min(1, 'Name is required'),
});

export const UpdateUnitSchema = CreateUnitSchema.partial();

export type CreateUnit = z.infer<typeof CreateUnitSchema>;
export type UpdateUnit = z.infer<typeof UpdateUnitSchema>;

export const UnitResponseSchema = z.object({
  id: z.uuid(),
  identifier: z.string(),
  name: z.string(),
  deletedAt: z.coerce.date().nullable(),
});

export type UnitResponse = z.infer<typeof UnitResponseSchema>;

export const UnitListResponseSchema =
  paginatedResponseSchema(UnitResponseSchema);
export type UnitListResponse = z.infer<typeof UnitListResponseSchema>;
