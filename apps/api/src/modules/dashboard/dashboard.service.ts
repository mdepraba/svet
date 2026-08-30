import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma.service';
import { SettingService } from '@/modules/settings/setting.service';

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingService,
  ) {}

  /**
   * Every figure on the dashboard, in one request. These are aggregates over
   * whole tables — computing them from a page of rows on the client would be
   * wrong on a busy day, and wrong without saying so.
   */
  async summary() {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    const weekAgo = addDays(today, -7);
    const twoWeeksAgo = addDays(today, -14);

    const { reorderPoint } = await this.settings.read();

    const [
      visitsByStatus,
      invoicesToday,
      lowStockCount,
      seenThisWeek,
      seenLastWeek,
    ] = await Promise.all([
      this.prisma.visit.groupBy({
        by: ['status'],
        where: { deletedAt: null, visitDate: { gte: today, lt: tomorrow } },
        _count: { _all: true },
      }),
      this.prisma.invoice.findMany({
        where: { deletedAt: null, createdAt: { gte: today, lt: tomorrow } },
        select: { status: true, totalGross: true },
      }),
      this.prisma.productStock.count({
        where: { totalQty: { lte: reorderPoint } },
      }),
      // Distinct patients, not visit rows — one pet seen three times in a week
      // is one patient seen.
      this.prisma.visitDetail.findMany({
        where: {
          deletedAt: null,
          visit: { deletedAt: null, visitDate: { gte: weekAgo, lt: tomorrow } },
        },
        select: { patientId: true },
        distinct: ['patientId'],
      }),
      this.prisma.visitDetail.findMany({
        where: {
          deletedAt: null,
          visit: {
            deletedAt: null,
            visitDate: { gte: twoWeeksAgo, lt: weekAgo },
          },
        },
        select: { patientId: true },
        distinct: ['patientId'],
      }),
    ]);

    const countFor = (status: string) =>
      visitsByStatus.find((row) => row.status === status)?._count._all ?? 0;

    const paid = invoicesToday.filter((invoice) => invoice.status === 'PAID');
    const pending = invoicesToday.filter(
      (invoice) => invoice.status === 'PENDING',
    );

    return {
      visitsToday: {
        total: visitsByStatus.reduce((sum, row) => sum + row._count._all, 0),
        scheduled: countFor('SCHEDULED'),
        ongoing: countFor('ONGOING'),
        finished: countFor('FINISHED'),
      },
      revenueToday: {
        // Only settled money counts as revenue; pending invoices are shown
        // beside it as a count so the number is not quietly optimistic.
        total: paid.reduce(
          (sum, invoice) => sum + Number(invoice.totalGross),
          0,
        ),
        paidCount: paid.length,
        pendingCount: pending.length,
      },
      lowStock: { count: lowStockCount, threshold: reorderPoint },
      patientsSeen: {
        thisWeek: seenThisWeek.length,
        lastWeek: seenLastWeek.length,
      },
    };
  }
}
