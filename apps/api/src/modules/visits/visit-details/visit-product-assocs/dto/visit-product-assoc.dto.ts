import { createZodDto } from 'nestjs-zod';
import {
  CreateVisitProductAssocSchema,
  UpdateVisitProductAssocSchema,
} from '@svet-monorepo/schemas';

export class CreateVisitProductAssocDto extends createZodDto(
  CreateVisitProductAssocSchema,
) {}
export class UpdateVisitProductAssocDto extends createZodDto(
  UpdateVisitProductAssocSchema,
) {}
