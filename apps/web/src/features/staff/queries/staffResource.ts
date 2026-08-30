import {
  type CreateUser,
  type RoleListResponse,
  RoleListResponseSchema,
  type RoleResponse,
  RoleResponseSchema,
  type UpdateUser,
  type UserListResponse,
  UserListResponseSchema,
  type UserResponse,
  UserResponseSchema,
  type CreateRole,
  type UpdateRole,
} from '@svet-monorepo/schemas';

import { createResource } from '@/lib/resource';

export const users = createResource<
  UserResponse,
  UserListResponse,
  CreateUser,
  UpdateUser
>({
  key: 'users',
  path: '/user',
  itemSchema: UserResponseSchema,
  listSchema: UserListResponseSchema,
});

export const roles = createResource<
  RoleResponse,
  RoleListResponse,
  CreateRole,
  UpdateRole
>({
  key: 'roles',
  path: '/role',
  itemSchema: RoleResponseSchema,
  listSchema: RoleListResponseSchema,
});
