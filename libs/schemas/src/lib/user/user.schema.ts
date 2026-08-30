import { z } from 'zod';
import { PasswordSchema } from '../auth/auth.schema';
import { paginatedResponseSchema } from '../common/pagination.schema';

export const CreateUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Invalid email format'),
  password: PasswordSchema,
  roleId: z.uuid('Invalid Role ID format'),
});

export const UpdateUserSchema = CreateUserSchema.partial();

export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;

// Deliberately excludes `password` — this is what the API sends back to clients.
export const UserResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.string(),
  roleId: z.uuid(),
  deletedAt: z.coerce.date().nullable(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;

export const UserListResponseSchema =
  paginatedResponseSchema(UserResponseSchema);
export type UserListResponse = z.infer<typeof UserListResponseSchema>;
