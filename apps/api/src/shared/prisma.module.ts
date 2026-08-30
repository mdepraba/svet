import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/** Provides {@link PrismaService} app-wide; `@Global` so no module imports it. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
