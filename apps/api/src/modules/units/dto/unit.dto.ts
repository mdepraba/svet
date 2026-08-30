import { createZodDto } from 'nestjs-zod';
import { CreateUnitSchema, UpdateUnitSchema } from '@svet-monorepo/schemas';

export class CreateUnitDto extends createZodDto(CreateUnitSchema) {}
export class UpdateUnitDto extends createZodDto(UpdateUnitSchema) {}
