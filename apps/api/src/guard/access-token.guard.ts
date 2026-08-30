import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuthPort } from '@/modules/auth';
import { REQUEST_PRINCIPAL_KEY } from './current-user.decorator';
import { IS_PUBLIC_ROUTE } from './public.decorator';

/**
 * The gate every request passes through, registered globally in
 * `app.module.ts` so the API is closed unless a route says `@Public()`.
 *
 * It lives here rather than inside the auth module because it is cross-cutting
 * — every module's routes run through it — and it reaches auth the same way
 * any other consumer would, through `AuthPort`. Its whole job is protocol:
 * pull a bearer token out of a header, ask who that is, hang the answer on the
 * request. Swap the token format and this file does not change.
 */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const accessToken = readBearerToken(request?.headers?.authorization);

    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_ROUTE,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      // Still resolve the caller when a token happens to be present, so a
      // public route can tailor itself to a signed-in visitor. A bad token on
      // a public route is ignored rather than fatal.
      if (accessToken) {
        request[REQUEST_PRINCIPAL_KEY] = await this.auth
          .authenticate(accessToken)
          .catch(() => undefined);
      }

      return true;
    }

    // Throws `NotAuthenticatedError` or `InvalidSessionError`; the auth
    // module's filter turns either into a 401.
    request[REQUEST_PRINCIPAL_KEY] = await this.auth.authenticate(accessToken);

    return true;
  }
}

function readBearerToken(header: unknown): string | null {
  if (typeof header !== 'string') return null;

  const [scheme, token] = header.split(' ');

  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}
