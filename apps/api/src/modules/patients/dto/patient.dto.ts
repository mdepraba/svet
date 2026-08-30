import { createZodDto } from 'nestjs-zod';
import {
  CreatePatientSchema,
  PatientQuerySchema,
  UpdatePatientSchema,
} from '@svet-monorepo/schemas';

export class CreatePatientDto extends createZodDto(CreatePatientSchema) {}
export class UpdatePatientDto extends createZodDto(UpdatePatientSchema) {}
export class PatientQueryDto extends createZodDto(PatientQuerySchema) {}
