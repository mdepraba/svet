import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/database/prisma/generated/client';
import { Pool } from 'pg';

/**
 * The Prisma client, connected and disconnected with the Nest lifecycle.
 *
 * Uses an explicit `pg` Pool through the `@prisma/adapter-pg` driver adapter
 * instead of Prisma's bundled engine, so the same build runs serverless.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    const adapter = new PrismaPg(pool);

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
