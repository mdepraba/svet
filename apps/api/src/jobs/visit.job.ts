import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/shared/prisma.service';
import { VisitStatusEnum } from '@svet-monorepo/schemas';

/** Nightly job that advances visit statuses nobody updated by hand. */
@Injectable()
export class VisitCronService {
  private readonly logger = new Logger(VisitCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Moves SCHEDULED visits to ONGOING once `scheduleAt` has passed, then
   * ONGOING visits to CANCELLED once it is over a day old.
   *
   * Idempotent — each update matches the status it changes *from* — so the
   * timer and the `/v1/cron/visit-status` route can both trigger it. Runs at
   * midnight in the server's timezone, which is UTC in deployment.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleVisitStatusAutomation() {
    this.logger.log('Menjalankan otomatisasi status kunjungan...');

    const now = new Date();
    const oneDayAgo = new Date();
    oneDayAgo.setDate(now.getDate() - 1);

    try {
      const toOngoing = await this.prisma.visit.updateMany({
        where: {
          status: VisitStatusEnum.enum.SCHEDULED,
          scheduleAt: { lte: now },
        },
        data: { status: VisitStatusEnum.enum.ONGOING },
      });

      const toCancelled = await this.prisma.visit.updateMany({
        where: {
          status: VisitStatusEnum.enum.ONGOING,
          scheduleAt: { lte: oneDayAgo },
        },
        data: { status: VisitStatusEnum.enum.CANCELLED },
      });

      this.logger.log(
        `Otomatisasi selesai. ${toOngoing.count} visit menjadi ONGOING, ${toCancelled.count} visit menjadi CANCELLED.`,
      );
    } catch (error) {
      this.logger.error('Gagal menjalankan otomatisasi status visit', error);
    }
  }
}
