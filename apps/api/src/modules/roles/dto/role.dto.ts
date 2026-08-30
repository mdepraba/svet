import { createZodDto } from 'nestjs-zod';
import { CreateRoleSchema, UpdateRoleSchema } from '@svet-monorepo/schemas';

export class CreateRoleDto extends createZodDto(CreateRoleSchema) {}
export class UpdateRoleDto extends createZodDto(UpdateRoleSchema) {}
