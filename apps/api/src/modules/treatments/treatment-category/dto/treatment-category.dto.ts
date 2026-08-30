import { createZodDto } from 'nestjs-zod';
import {
  CreateTreatmentCategorySchema,
  UpdateTreatmentCategorySchema,
} from '@svet-monorepo/schemas';

export class CreateTreatmentCategoryDto extends createZodDto(
  CreateTreatmentCategorySchema,
) {}
export class UpdateTreatmentCategoryDto extends createZodDto(
  UpdateTreatmentCategorySchema,
) {}
