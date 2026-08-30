import { createZodDto } from 'nestjs-zod';
import { CreateTaxSchema, UpdateTaxSchema } from '@svet-monorepo/schemas';

export class CreateTaxDto extends createZodDto(CreateTaxSchema) {}
export class UpdateTaxDto extends createZodDto(UpdateTaxSchema) {}
