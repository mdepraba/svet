import { createZodDto } from 'nestjs-zod';
import {
  CreateInvoiceSchema,
  InvoiceStatusEnum,
  PaymentMethodEnum,
  UpdateInvoiceSchema,
} from '@svet-monorepo/schemas';

export { InvoiceStatusEnum, PaymentMethodEnum };

export class CreateInvoiceDto extends createZodDto(CreateInvoiceSchema) {}
export class UpdateInvoiceDto extends createZodDto(UpdateInvoiceSchema) {}
