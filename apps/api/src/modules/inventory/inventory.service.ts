import { Injectable } from '@nestjs/common';
import { paginate } from '@/common/utils/pagination.util';
import { Prisma } from '@/database/prisma/generated/client';
import { PrismaService } from '@/shared/prisma.service';
import { CreateStockMovementDto, LedgerQueryDto } from './dto/inventory.dto';

type MovementTypeValue = Prisma.StockLedgerCreateInput['movementType'];

/** Which movement types each of the ledger's filter tabs covers. */
const MOVEMENT_GROUPS: Record<'in' | 'out' | 'medical', MovementTypeValue[]> = {
  in: ['PURCHASE_IN', 'RETURN_IN', 'ADJUSTMENT_IN', 'TRANSFER_IN'],
  out: ['SALE_OUT', 'ADJUSTMENT_OUT', 'TRANSFER_OUT'],
  medical: ['MEDICAL_USE'],
};

const ledgerInclude = {
  product: {
    select: { id: true, sku: true, name: true, dispensingUnit: true },
  },
  createdByUser: { select: { id: true, name: true } },
} satisfies Prisma.StockLedgerInclude;

/**
 * The balance walk only reads these four fields, so it stays generic over
 * whatever else the caller selected and hands the rows back unchanged plus
 * `balanceAfter`.
 */
type BalanceInput = {
  id: string;
  productId: string;
  changeQty: Prisma.Decimal | number;
  createdAt: Date;
};

/**
 * Stock is an append-only ledger plus a running total per product. Nothing
 * writes `ProductStock` directly — every change goes through `record`, so the
 * summary can always be rebuilt by replaying the ledger.
 */
@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findLedger(query: LedgerQueryDto) {
    const { search, movement } = query;

    const whereCondition: Prisma.StockLedgerWhereInput = {
      ...(movement &&
        movement !== 'all' && {
          movementType: { in: MOVEMENT_GROUPS[movement] },
        }),
      ...(search && {
        OR: [
          { product: { name: { contains: search, mode: 'insensitive' } } },
          { product: { sku: { contains: search, mode: 'insensitive' } } },
          { movementRef: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const page = await paginate(
      this.prisma.stockLedger,
      { where: whereCondition, include: ledgerInclude },
      query,
    );

    return { ...page, data: await this.withRunningBalance(page.data) };
  }

  /**
   * A ledger is read for its balance column, so each row carries the on-hand
   * quantity immediately after it. The stored total is only the figure *now*,
   * so the newer movements are unwound from it: for a row at time t,
   * balance(t) = total_now − sum(changes after t).
   *
   * Costs one extra query for the whole page, not one per row.
   */
  private async withRunningBalance<T extends BalanceInput>(
    rows: T[],
  ): Promise<(T & { balanceAfter: number | null })[]> {
    if (rows.length === 0) return [];

    const productIds = [...new Set(rows.map((row) => row.productId))];
    const oldestOnPage = rows.reduce(
      (oldest, row) => (row.createdAt < oldest ? row.createdAt : oldest),
      rows[0].createdAt,
    );

    const [stocks, newerMovements] = await Promise.all([
      this.prisma.productStock.findMany({
        where: { productId: { in: productIds } },
        select: { productId: true, totalQty: true },
      }),
      this.prisma.stockLedger.findMany({
        where: {
          productId: { in: productIds },
          createdAt: { gte: oldestOnPage },
        },
        select: { id: true, productId: true, changeQty: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalByProduct = new Map(
      stocks.map((stock) => [stock.productId, Number(stock.totalQty)]),
    );

    // Walk newest → oldest per product, subtracting each change as we pass it.
    const runningByProduct = new Map(totalByProduct);
    const balanceByRow = new Map<string, number>();

    for (const movement of newerMovements) {
      const running = runningByProduct.get(movement.productId);
      if (running === undefined) continue;
      balanceByRow.set(movement.id, running);
      runningByProduct.set(
        movement.productId,
        running - Number(movement.changeQty),
      );
    }

    return rows.map((row) => ({
      ...row,
      balanceAfter: balanceByRow.get(row.id) ?? null,
    }));
  }

  async findStock() {
    return await this.prisma.productStock.findMany({
      include: {
        product: {
          select: { id: true, sku: true, name: true, dispensingUnit: true },
        },
      },
      orderBy: { product: { name: 'asc' } },
    });
  }

  async findLowStock(threshold = 5) {
    return await this.prisma.productStock.findMany({
      where: { totalQty: { lte: threshold } },
      include: {
        product: {
          select: { id: true, sku: true, name: true, dispensingUnit: true },
        },
      },
      orderBy: { totalQty: 'asc' },
    });
  }

  /**
   * Appends one movement and moves the running total by the same amount, in a
   * single transaction so the two can never disagree.
   */
  async record(input: CreateStockMovementDto) {
    return await this.prisma.$transaction(async (tx) => {
      const movement = await tx.stockLedger.create({
        data: {
          productId: input.productId,
          movementType: input.movementType,
          movementRef: input.movementRef ?? null,
          changeQty: input.changeQty,
          costUnitPrice: input.costUnitPrice ?? null,
          notes: input.notes ?? null,
        },
        include: ledgerInclude,
      });

      const stock = await tx.productStock.upsert({
        where: { productId: input.productId },
        create: { productId: input.productId, totalQty: input.changeQty },
        update: { totalQty: { increment: input.changeQty } },
      });

      // This movement is the newest one, so the total we just wrote *is* its
      // running balance. Returning it keeps the response the same shape as a
      // ledger row, which is what the client parses it as.
      return { ...movement, balanceAfter: Number(stock.totalQty) };
    });
  }

  /**
   * Bulk form of `record`, used when a visit is finished and every product it
   * consumed leaves stock at once.
   */
  async recordMany(inputs: CreateStockMovementDto[]) {
    if (inputs.length === 0) return [];

    return await this.prisma.$transaction(async (tx) => {
      await tx.stockLedger.createMany({
        data: inputs.map((input) => ({
          productId: input.productId,
          movementType: input.movementType,
          movementRef: input.movementRef ?? null,
          changeQty: input.changeQty,
          costUnitPrice: input.costUnitPrice ?? null,
          notes: input.notes ?? null,
        })),
      });

      // One product can appear on several lines of the same visit; fold them
      // so the summary takes a single update per product.
      const byProduct = new Map<string, number>();
      for (const input of inputs) {
        byProduct.set(
          input.productId,
          (byProduct.get(input.productId) ?? 0) + input.changeQty,
        );
      }

      for (const [productId, changeQty] of byProduct) {
        await tx.productStock.upsert({
          where: { productId },
          create: { productId, totalQty: changeQty },
          update: { totalQty: { increment: changeQty } },
        });
      }

      return inputs;
    });
  }
}
