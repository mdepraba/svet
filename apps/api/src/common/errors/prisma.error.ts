import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@/database/prisma/generated/client';
import { FastifyReply } from 'fastify';

/**
 * Maps known Prisma errors to HTTP responses — P2002 to 409, P2025 to 404,
 * anything else to 500 — using Nest's `{ statusCode, message, error }` body.
 * Registered globally in `configure-app.ts`.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    switch (exception.code) {
      case 'P2002': {
        status = HttpStatus.CONFLICT;
        const target = exception.meta?.target as string[];
        message = `Duplicate data error. The field(s) [${target?.join(', ')}] must be unique.`;
        break;
      }
      case 'P2025': {
        status = HttpStatus.NOT_FOUND;
        message = 'The requested resource was not found.';
        break;
      }
      default: {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = exception.message;
        console.error(exception.message);
        break;
      }
    }

    response.status(status).send({
      statusCode: status,
      message: message,
      error: exception.name,
    });
  }
}
