import { z } from 'zod';
import { paginatedResponseSchema } from '../common/pagination.schema';

export const CreateTaxSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  rate: z
    .number('Rate must be a number')
    .nonnegative('Rate cannot be negative'),
});

export const UpdateTaxSchema = CreateTaxSchema.partial();

export type CreateTax = z.infer<typeof CreateTaxSchema>;
export type UpdateTax = z.infer<typeof UpdateTaxSchema>;

export const TaxResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  rate: z.coerce.number(),
  deletedAt: z.coerce.date().nullable(),
});

export type TaxResponse = z.infer<typeof TaxResponseSchema>;

export const TaxListResponseSchema = paginatedResponseSchema(TaxResponseSchema);
export type TaxListResponse = z.infer<typeof TaxListResponseSchema>;
