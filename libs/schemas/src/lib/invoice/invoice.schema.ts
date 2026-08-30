import { z } from 'zod';
import { paginatedResponseSchema } from '../common/pagination.schema';

export const PaymentMethodEnum = z.enum(['CASH', 'QRIS', 'TRANSFER']);
export const InvoiceStatusEnum = z.enum(['PENDING', 'PAID', 'CANCELLED']);

export const CreateInvoiceDetailSchema = z
  .object({
    productId: z.uuid().nullable().optional(),
    treatmentId: z.uuid().nullable().optional(),
    quantity: z.number().positive('Quantity must be greater than 0'),
    unitPrice: z.number().nonnegative(),
    notes: z.string().nullable().optional(),
  })
  .refine((line) => Boolean(line.productId) !== Boolean(line.treatmentId), {
    message: 'A line is either a product or a treatment, not both',
  });

export const CreateInvoiceSchema = z.object({
  /**
   * Optional: a walk-in buying products over the counter has no visit and no
   * owner record. An invoice attached to a visit always carries one.
   */
  ownerId: z.uuid('Invalid Owner ID format').nullable().optional(),
  visitId: z.uuid('Invalid Visit ID format').nullable().optional(),
  paymentMethod: PaymentMethodEnum,
  status: InvoiceStatusEnum.optional(),
  totalDiscount: z.number().nonnegative().optional(),
  details: z.array(CreateInvoiceDetailSchema).min(1, 'Add at least one line'),
});

export const UpdateInvoiceSchema = z.object({
  paymentMethod: PaymentMethodEnum.optional(),
  status: InvoiceStatusEnum.optional(),
  totalDiscount: z.number().nonnegative().optional(),
  paidAt: z
    .string()
    .refine((val) => !Number.isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    })
    .transform((val) => new Date(val))
    .nullable()
    .optional(),
});

export type CreateInvoice = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoice = z.infer<typeof UpdateInvoiceSchema>;

export const InvoiceDetailResponseSchema = z.object({
  id: z.uuid(),
  invoiceId: z.uuid(),
  productId: z.uuid().nullable(),
  treatmentId: z.uuid().nullable(),
  quantity: z.coerce.number(),
  unitPrice: z.coerce.number(),
  subtotal: z.coerce.number(),
  notes: z.string().nullable(),
  product: z
    .object({ id: z.uuid(), name: z.string(), dispensingUnit: z.string() })
    .nullable(),
  treatment: z.object({ id: z.uuid(), name: z.string() }).nullable(),
});

export type InvoiceDetailResponse = z.infer<typeof InvoiceDetailResponseSchema>;

export const InvoiceResponseSchema = z.object({
  id: z.uuid(),
  identifier: z.string(),
  ownerId: z.uuid().nullable(),
  visitId: z.uuid().nullable(),
  totalBase: z.coerce.number(),
  totalGross: z.coerce.number(),
  totalTax: z.coerce.number(),
  totalDiscount: z.coerce.number(),
  paymentMethod: PaymentMethodEnum,
  paidAt: z.coerce.date().nullable(),
  status: InvoiceStatusEnum,
  createdAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
  owner: z
    .object({
      id: z.uuid(),
      name: z.string(),
      phone: z.string().nullable(),
      email: z.string().nullable(),
    })
    .nullable(),
  invoiceDetails: z.array(InvoiceDetailResponseSchema),
});

export type InvoiceResponse = z.infer<typeof InvoiceResponseSchema>;

export const InvoiceListResponseSchema = paginatedResponseSchema(
  InvoiceResponseSchema,
);
export type InvoiceListResponse = z.infer<typeof InvoiceListResponseSchema>;
