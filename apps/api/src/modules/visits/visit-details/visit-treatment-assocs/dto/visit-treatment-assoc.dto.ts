import { createZodDto } from 'nestjs-zod';
import {
  CreateVisitTreatmentAssocSchema,
  UpdateVisitTreatmentAssocSchema,
} from '@svet-monorepo/schemas';

export class CreateVisitTreatmentAssocDto extends createZodDto(
  CreateVisitTreatmentAssocSchema,
) {}
export class UpdateVisitTreatmentAssocDto extends createZodDto(
  UpdateVisitTreatmentAssocSchema,
) {}
