import { createZodDto } from 'nestjs-zod';
import {
  CreateProductCategorySchema,
  UpdateProductCategorySchema,
} from '@svet-monorepo/schemas';

export class CreateProductCategoryDto extends createZodDto(
  CreateProductCategorySchema,
) {}
export class UpdateProductCategoryDto extends createZodDto(
  UpdateProductCategorySchema,
) {}
