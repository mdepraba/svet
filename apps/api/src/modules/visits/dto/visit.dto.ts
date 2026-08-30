import { createZodDto } from 'nestjs-zod';
import {
  CreateVisitSchema,
  SaveWorksheetSchema,
  UpdateVisitSchema,
  VisitQuerySchema,
  VisitStatusEnum,
  VisitTypeEnum,
} from '@svet-monorepo/schemas';

export { VisitStatusEnum, VisitTypeEnum };

export class CreateVisitDto extends createZodDto(CreateVisitSchema) {}
export class UpdateVisitDto extends createZodDto(UpdateVisitSchema) {}
export class VisitQueryDto extends createZodDto(VisitQuerySchema) {}
export class SaveWorksheetDto extends createZodDto(SaveWorksheetSchema) {}
