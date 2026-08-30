import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { SessionService } from './session.service';

/**
 * The one thing in this module the clock drives rather than a person.
 *
 * Kept apart from `SessionService` so scheduling never leaks into the class
 * the sign-in paths depend on.
 */
@Injectable()
export class SessionPruneService {
  private readonly logger = new Logger(SessionPruneService.name);

  constructor(private readonly sessions: SessionService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handlePrune(): Promise<void> {
    try {
      const removed = await this.sessions.pruneExpired();

      if (removed > 0) {
        this.logger.log(`Pruned ${removed} expired refresh token(s).`);
      }
    } catch (error) {
      // A failed prune costs disk, not correctness — never take the app down.
      this.logger.error('Could not prune expired refresh tokens', error);
    }
  }
}
