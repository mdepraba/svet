import {
  type CreateInvoice,
  type InvoiceListResponse,
  InvoiceListResponseSchema,
  type InvoiceResponse,
  InvoiceResponseSchema,
  type UpdateInvoice,
} from '@svet-monorepo/schemas';

import { createResource } from '@/lib/resource';

export const invoices = createResource<
  InvoiceResponse,
  InvoiceListResponse,
  CreateInvoice,
  UpdateInvoice
>({
  key: 'invoices',
  path: '/invoice',
  itemSchema: InvoiceResponseSchema,
  listSchema: InvoiceListResponseSchema,
});
