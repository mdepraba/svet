import {
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Logger,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { timingSafeEqual } from 'node:crypto';

import { AuthPort } from '@/modules/auth';
import { Public } from '@/guard/public.decorator';
import { VisitCronService } from './visit.job';

/**
 * The clock, when the clock lives outside the process.
 *
 * A serverless deployment is frozen between requests, so the `@Cron` timers in
 * `visit.job.ts` and the auth module never fire there. The platform scheduler
 * calls these routes instead; the schedule itself lives in
 * `tools/vercel/api-output.mjs`, next to the rest of the deployment shape.
 *
 * On a long-running host the decorators still drive the work and these routes
 * simply go uncalled. Both jobs are idempotent, so having two possible
 * triggers is safe rather than something to guard against.
 */
@ApiExcludeController()
@Controller('cron')
export class CronController {
  private readonly logger = new Logger(CronController.name);

  constructor(
    private readonly visits: VisitCronService,
    private readonly auth: AuthPort,
  ) {}

  @Public()
  @Get('visit-status')
  async visitStatus(@Headers('authorization') authorization?: string) {
    this.assertCronCaller(authorization);
    await this.visits.handleVisitStatusAutomation();

    return { ok: true };
  }

  @Public()
  @Get('prune-sessions')
  async pruneSessions(@Headers('authorization') authorization?: string) {
    this.assertCronCaller(authorization);
    const removed = await this.auth.pruneExpiredSessions();

    return { ok: true, removed };
  }

  /**
   * These routes are `@Public()` — they carry no user — so they need their own
   * door. Vercel Cron sends `Authorization: Bearer $CRON_SECRET`; anything
   * else is a stranger asking us to mutate visit rows.
   */
  private assertCronCaller(authorization?: string): void {
    const expected = process.env.CRON_SECRET;

    if (!expected) {
      // Failing closed matters more here than convenience: an unset secret on
      // a deployed API would otherwise leave these routes wide open.
      this.logger.error('CRON_SECRET is not set — refusing to run the job.');
      throw new ForbiddenException();
    }

    const supplied = authorization?.replace(/^Bearer /i, '') ?? '';
    const a = Buffer.from(supplied);
    const b = Buffer.from(expected);

    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new ForbiddenException();
    }
  }
}
