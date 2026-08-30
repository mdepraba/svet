import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type Pagination = z.infer<typeof PaginationSchema>;

export const PaginationMetaSchema = z.object({
  total: z.number().int().min(0),
  lastPage: z.number().int().min(0),
  currentPage: z.number().int().min(1),
  perPage: z.number().int().min(1),
  prev: z.number().nullable(),
  next: z.number().nullable(),
});

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

export function paginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    meta: PaginationMetaSchema,
  });
}
