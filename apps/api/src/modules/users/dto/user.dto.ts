import { createZodDto } from 'nestjs-zod';
import { CreateUserSchema, UpdateUserSchema } from '@svet-monorepo/schemas';

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
