import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_ROUTE = 'auth:public-route';

/**
 * Opens one route to unauthenticated callers.
 *
 * `AccessTokenGuard` is registered globally, so every endpoint in the API needs
 * a token unless it carries this. Protected by default, on purpose: forgetting
 * to add a guard is a silent hole, whereas forgetting `@Public()` is a 401 the
 * first time anyone tries.
 */
export const Public = () => SetMetadata(IS_PUBLIC_ROUTE, true);
