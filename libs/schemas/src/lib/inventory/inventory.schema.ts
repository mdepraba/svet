import { z } from 'zod';
import { paginatedResponseSchema } from '../common/pagination.schema';

export const MovementTypeEnum = z.enum([
  'PURCHASE_IN',
  'SALE_OUT',
  'MEDICAL_USE',
  'RETURN_IN',
  'ADJUSTMENT_IN',
  'ADJUSTMENT_OUT',
  'TRANSFER_IN',
  'TRANSFER_OUT',
]);

export type MovementType = z.infer<typeof MovementTypeEnum>;

/** The ledger's filter tabs, each covering a group of movement types. */
export const MovementFilterEnum = z.enum(['all', 'in', 'out', 'medical']);
export type MovementFilter = z.infer<typeof MovementFilterEnum>;

export const LedgerQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  movement: MovementFilterEnum.optional(),
});

export type LedgerQuery = z.infer<typeof LedgerQuerySchema>;

export const CreateStockMovementSchema = z.object({
  productId: z.uuid('Invalid Product ID format'),
  movementType: MovementTypeEnum,
  movementRef: z.string().nullable().optional(),
  /** Signed by the caller: positive for an inbound movement, negative out. */
  changeQty: z.number().refine((n) => n !== 0, 'Quantity cannot be zero'),
  costUnitPrice: z.number().nonnegative().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type CreateStockMovement = z.infer<typeof CreateStockMovementSchema>;

export const StockMovementResponseSchema = z.object({
  id: z.uuid(),
  productId: z.uuid(),
  movementType: MovementTypeEnum,
  movementRef: z.string().nullable(),
  changeQty: z.coerce.number(),
  costUnitPrice: z.coerce.number().nullable(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
  product: z.object({
    id: z.uuid(),
    sku: z.string(),
    name: z.string(),
    dispensingUnit: z.string(),
  }),
  createdByUser: z.object({ id: z.uuid(), name: z.string() }).nullable(),
  /**
   * On-hand quantity of this product immediately after this movement — the
   * running balance a ledger is read for. Computed server-side by unwinding
   * the newer movements from the current total.
   */
  balanceAfter: z.coerce.number().nullable(),
});

export type StockMovementResponse = z.infer<typeof StockMovementResponseSchema>;

export const StockMovementListResponseSchema = paginatedResponseSchema(
  StockMovementResponseSchema,
);
export type StockMovementListResponse = z.infer<
  typeof StockMovementListResponseSchema
>;

/** On-hand quantity per product, for the stock column and the low-stock panel. */
export const ProductStockResponseSchema = z.object({
  productId: z.uuid(),
  totalQty: z.coerce.number(),
  product: z.object({
    id: z.uuid(),
    sku: z.string(),
    name: z.string(),
    dispensingUnit: z.string(),
  }),
});

export type ProductStockResponse = z.infer<typeof ProductStockResponseSchema>;
export const ProductStockListSchema = z.array(ProductStockResponseSchema);
