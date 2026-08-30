import { type ExecutionContext, createParamDecorator } from '@nestjs/common';

import type { AuthenticatedPrincipal } from '@/modules/auth';

export const REQUEST_PRINCIPAL_KEY = 'authPrincipal';

/**
 * The signed-in caller, as put on the request by `AccessTokenGuard`.
 *
 * `undefined` on a `@Public()` route reached without a token — which is why
 * the type says so.
 */
export const CurrentUser = createParamDecorator(
  (
    _data: unknown,
    context: ExecutionContext,
  ): AuthenticatedPrincipal | undefined =>
    context.switchToHttp().getRequest()[REQUEST_PRINCIPAL_KEY],
);
