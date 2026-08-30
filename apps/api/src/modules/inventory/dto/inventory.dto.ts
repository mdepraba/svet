import { createZodDto } from 'nestjs-zod';
import {
  CreateStockMovementSchema,
  LedgerQuerySchema,
  MovementTypeEnum,
} from '@svet-monorepo/schemas';

export { MovementTypeEnum };

export class CreateStockMovementDto extends createZodDto(
  CreateStockMovementSchema,
) {}

export class LedgerQueryDto extends createZodDto(LedgerQuerySchema) {}
