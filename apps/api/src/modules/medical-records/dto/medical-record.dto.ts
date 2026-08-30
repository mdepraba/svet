import { createZodDto } from 'nestjs-zod';
import {
  CreateMedicalRecordSchema,
  UpdateMedicalRecordSchema,
} from '@svet-monorepo/schemas';

export class CreateMedicalRecordDto extends createZodDto(
  CreateMedicalRecordSchema,
) {}
export class UpdateMedicalRecordDto extends createZodDto(
  UpdateMedicalRecordSchema,
) {}
