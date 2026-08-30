import { createZodDto } from 'nestjs-zod';
import { CreateOwnerSchema, UpdateOwnerSchema } from '@svet-monorepo/schemas';

export class CreateOwnerDto extends createZodDto(CreateOwnerSchema) {}
export class UpdateOwnerDto extends createZodDto(UpdateOwnerSchema) {}
