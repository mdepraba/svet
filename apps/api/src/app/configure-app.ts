import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { PrismaClientExceptionFilter } from '@/common/errors/prisma.error';

export const GLOBAL_PREFIX = 'v1';

/**
 * Everything that has to be true of the app regardless of how it is being
 * served. `main.ts` listens on a port with it; `serverless.ts` hands the same
 * configured app to a platform handler. Keeping it here is what stops the two
 * entry points from drifting — a CORS origin fixed in one and not the other is
 * the kind of bug that only shows up in production.
 */
export function configureApp(app: INestApplication): void {
  // @fastify/cors defaults to GET,HEAD,POST only, so every PATCH/PUT/DELETE
  // preflight would fail. The verbs are listed explicitly.
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:4200',
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });
  app.useGlobalFilters(new PrismaClientExceptionFilter());
  app.setGlobalPrefix(GLOBAL_PREFIX);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SVET ERP API')
    .setDescription('API documentation for the SVET ERP backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, cleanupOpenApiDoc(swaggerDocument));
}
