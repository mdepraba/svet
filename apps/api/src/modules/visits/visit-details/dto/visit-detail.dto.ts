import { createZodDto } from 'nestjs-zod';
import {
  CreateVisitDetailSchema,
  UpdateVisitDetailSchema,
} from '@svet-monorepo/schemas';

export class CreateVisitDetailDto extends createZodDto(
  CreateVisitDetailSchema,
) {}
export class UpdateVisitDetailDto extends createZodDto(
  UpdateVisitDetailSchema,
) {}
