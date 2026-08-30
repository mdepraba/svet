import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';

import { AuthError, type AuthErrorCode } from '../services/auth.errors';

/**
 * The single place where an authentication rule becomes an HTTP status.
 *
 * Keeping the mapping here is what lets `services/` throw
 * `ProviderEmailUnverifiedError` without importing Nest. Registered globally
 * from `auth.module.ts`, because the global guard raises these errors too.
 */
const STATUS_BY_CODE: Record<AuthErrorCode, HttpStatus> = {
  INVALID_CREDENTIALS: HttpStatus.UNAUTHORIZED,
  NOT_AUTHENTICATED: HttpStatus.UNAUTHORIZED,
  INVALID_SESSION: HttpStatus.UNAUTHORIZED,
  SESSION_REUSED: HttpStatus.UNAUTHORIZED,
  ACCOUNT_DEACTIVATED: HttpStatus.FORBIDDEN,
  PROVIDER_EMAIL_UNVERIFIED: HttpStatus.FORBIDDEN,
  EMAIL_ALREADY_REGISTERED: HttpStatus.CONFLICT,
  UNKNOWN_IDENTITY_PROVIDER: HttpStatus.NOT_FOUND,
  PROVIDER_EMAIL_MISSING: HttpStatus.BAD_REQUEST,
  IDENTITY_PROVIDER_FAILED: HttpStatus.BAD_GATEWAY,
  ROLE_UNAVAILABLE: HttpStatus.INTERNAL_SERVER_ERROR,
};

@Catch(AuthError)
export class AuthErrorFilter implements ExceptionFilter {
  catch(exception: AuthError, host: ArgumentsHost) {
    const reply = host.switchToHttp().getResponse<FastifyReply>();
    const status =
      STATUS_BY_CODE[exception.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;

    if (status === HttpStatus.UNAUTHORIZED) {
      // Tells a client this is an auth failure rather than a permission one,
      // which is what the web client keys its silent-refresh retry on.
      reply.header('WWW-Authenticate', 'Bearer');
    }

    reply.status(status).send({
      statusCode: status,
      message: exception.message,
      error: exception.code,
    });
  }
}
