import { createZodDto } from 'nestjs-zod';
import {
  CreateProductSchema,
  UpdateProductSchema,
  ProductQuerySchema,
} from '@svet-monorepo/schemas';

export class CreateProductDto extends createZodDto(CreateProductSchema) {}
export class UpdateProductDto extends createZodDto(UpdateProductSchema) {}
export class ProductQueryDto extends createZodDto(ProductQuerySchema) {}
