import { createZodDto } from 'nestjs-zod';
import {
  CreateTreatmentSchema,
  UpdateTreatmentSchema,
  SaveTreatmentRecipeSchema,
} from '@svet-monorepo/schemas';

export class CreateTreatmentDto extends createZodDto(CreateTreatmentSchema) {}
export class UpdateTreatmentDto extends createZodDto(UpdateTreatmentSchema) {}
export class SaveTreatmentRecipeDto extends createZodDto(
  SaveTreatmentRecipeSchema,
) {}
