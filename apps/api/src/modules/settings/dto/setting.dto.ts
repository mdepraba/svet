import { createZodDto } from 'nestjs-zod';
import { UpdateClinicSettingsSchema } from '@svet-monorepo/schemas';

export class UpdateClinicSettingsDto extends createZodDto(
  UpdateClinicSettingsSchema,
) {}
