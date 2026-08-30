import { z } from 'zod';
import { paginatedResponseSchema } from '../common/pagination.schema';

export const CreateRoleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export const UpdateRoleSchema = CreateRoleSchema.partial();

export type CreateRole = z.infer<typeof CreateRoleSchema>;
export type UpdateRole = z.infer<typeof UpdateRoleSchema>;

export const RoleResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  deletedAt: z.coerce.date().nullable(),
});

export type RoleResponse = z.infer<typeof RoleResponseSchema>;

export const RoleListResponseSchema =
  paginatedResponseSchema(RoleResponseSchema);
export type RoleListResponse = z.infer<typeof RoleListResponseSchema>;
