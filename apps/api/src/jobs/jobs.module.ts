import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth';
import { CronController } from './cron.controller';
import { VisitCronService } from './visit.job';

/**
 * Scheduled work and the routes that trigger it where timers cannot run.
 * Imports `AuthModule` for `AuthPort`, used by the session-pruning route.
 */
@Module({
  imports: [AuthModule],
  controllers: [CronController],
  providers: [VisitCronService],
})
export class JobsModule {}
