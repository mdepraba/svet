import { createZodDto } from 'nestjs-zod';
import {
  CreateMedicalUsageSchema,
  UpdateMedicalUsageSchema,
} from '@svet-monorepo/schemas';

export class CreateMedicalUsageDto extends createZodDto(
  CreateMedicalUsageSchema,
) {}
export class UpdateMedicalUsageDto extends createZodDto(
  UpdateMedicalUsageSchema,
) {}
