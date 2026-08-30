import { Inject, Injectable } from '@nestjs/common';

import type { AuthenticatedPrincipal } from '../contracts';
import {
  TOKEN_ISSUER,
  type TokenIssuerPort,
} from '../infrastructure/token-issuer.port';
import { AccountService } from '../services/account.service';
import { NotAuthenticatedError } from '../services/auth.errors';
import { assertCanStartSession, toAuthUser } from '../services/auth.rules';
import { SessionService } from '../services/session.service';

/**
 * What auth offers the rest of the process, in-process only.
 *
 * Never mounted on a route and never reachable from a browser — the HTTP
 * surface is `controllers/auth.controller.ts`. The one consumer today is the
 * global `AccessTokenGuard` in `apps/api/src/guard/`, which needs to turn a
 * bearer header into a caller without knowing that JWTs exist.
 */
@Injectable()
export class AuthPort {
  constructor(
    @Inject(TOKEN_ISSUER) private readonly tokens: TokenIssuerPort,
    private readonly accounts: AccountService,
    private readonly sessions: SessionService,
  ) {}

  /**
   * Resolves the caller behind an access token.
   *
   * No database round trip: the access token is short-lived precisely so it
   * can be trusted on its signature alone. Revocation lands at the next
   * refresh, which is the trade a stateless access token makes.
   */
  async authenticate(
    accessToken: string | null,
  ): Promise<AuthenticatedPrincipal> {
    if (!accessToken) throw new NotAuthenticatedError();

    return this.tokens.verifyAccessToken(accessToken);
  }

  /**
   * The fuller picture, for `GET /auth/me` — the one authenticated read that
   * does hit the database, because it reports things the token does not carry,
   * such as which providers are linked.
   */
  async describe(userId: string) {
    const account = await this.accounts.findById(userId);

    // The token is valid but the account behind it is gone.
    if (!account) throw new NotAuthenticatedError();

    assertCanStartSession(account);

    return toAuthUser(account);
  }

  /**
   * Drops refresh tokens whose expiry has passed.
   *
   * Offered here because on a serverless host nothing inside this process
   * holds a clock — the scheduler in `services/session-prune.service.ts` only
   * fires on a long-running deployment. The platform's cron calls an HTTP
   * route, and that route reaches auth the same way every other consumer
   * does. Idempotent, so running it from both paths costs nothing.
   */
  async pruneExpiredSessions(): Promise<number> {
    return this.sessions.pruneExpired();
  }
}
