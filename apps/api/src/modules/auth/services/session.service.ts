import { Inject, Injectable } from '@nestjs/common';
import type { AuthSession } from '@svet-monorepo/schemas';

import { PrismaService } from '@/shared/prisma.service';
import {
  TOKEN_ISSUER,
  type TokenIssuerPort,
} from '../infrastructure/token-issuer.port';
import { AccountService } from './account.service';
import { InvalidSessionError, SessionReusedError } from './auth.errors';
import { type AuthAccount, assertCanStartSession, toAuthUser } from './auth.rules';

/**
 * Everything to do with a live session: handing one out, rotating it, ending
 * it, and clearing up after it.
 *
 * Every sign-in path in this folder ends here, whichever door was used.
 */
@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: AccountService,
    @Inject(TOKEN_ISSUER) private readonly tokens: TokenIssuerPort,
  ) {}

  /** A brand new sign-in: starts its own token family. */
  async issueFor(account: AuthAccount): Promise<AuthSession> {
    const refresh = await this.tokens.issueRefreshToken({
      userId: account.id,
    });

    await this.prisma.refreshToken.create({
      data: {
        id: refresh.tokenId,
        userId: account.id,
        familyId: refresh.familyId,
        fingerprint: refresh.fingerprint,
        expiresAt: refresh.expiresAt,
      },
    });

    return this.assemble(account, refresh.token);
  }

  /**
   * Trades a refresh token for a new pair, once.
   *
   * A valid signature is not enough. The token must also match a live row, and
   * presenting one that has already been rotated away is treated as theft: the
   * legitimate holder and the attacker both hold tokens from the same family,
   * so the family is burned and both are forced to sign in again. Losing a
   * session is the cheap outcome; leaving a stolen token working is not.
   */
  async refresh(refreshToken: string): Promise<AuthSession> {
    const claims = await this.tokens.verifyRefreshToken(refreshToken);
    const now = new Date();

    const stored = await this.prisma.refreshToken.findUnique({
      where: { id: claims.tokenId },
    });

    // Correctly signed but no row behind it: the family was already burned, or
    // pruned after expiry. Either way nothing descended from it should live.
    if (!stored) {
      await this.revokeFamily(claims.familyId, now);
      throw new InvalidSessionError();
    }

    if (stored.revokedAt !== null) {
      await this.revokeFamily(stored.familyId, now);
      throw new SessionReusedError();
    }

    // The signature already covers the payload; this catches a row reachable
    // by id that is not the token which created it.
    if (stored.fingerprint !== claims.fingerprint) {
      await this.revokeFamily(stored.familyId, now);
      throw new SessionReusedError();
    }

    if (stored.expiresAt.getTime() <= now.getTime()) {
      await this.prisma.refreshToken.updateMany({
        where: { id: stored.id, revokedAt: null },
        data: { revokedAt: now },
      });
      throw new InvalidSessionError('Your session has expired. Sign in again.');
    }

    const account = await this.accounts.findById(stored.userId);

    if (!account) {
      await this.revokeFamily(stored.familyId, now);
      throw new InvalidSessionError();
    }

    // Where deactivation actually bites: an admin who switches a staff account
    // off ends its access as soon as the current access token runs out.
    assertCanStartSession(account);

    const next = await this.tokens.issueRefreshToken({
      userId: account.id,
      familyId: stored.familyId,
    });

    // One transaction, so there is never a moment where both tokens are live
    // or where the old one is retired and no successor exists.
    await this.prisma.$transaction([
      this.prisma.refreshToken.create({
        data: {
          id: next.tokenId,
          userId: account.id,
          familyId: next.familyId,
          fingerprint: next.fingerprint,
          expiresAt: next.expiresAt,
        },
      }),
      this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: now, replacedById: next.tokenId },
      }),
    ]);

    return this.assemble(account, next.token);
  }

  /**
   * Ends a session. Idempotent on purpose: a token that is already expired,
   * revoked, or malformed still counts as signed out, because a client that
   * cannot complete sign-out is a client stuck holding credentials it wants to
   * throw away.
   */
  async revoke(refreshToken: string, allSessions = false): Promise<void> {
    const claims = await this.tokens
      .verifyRefreshToken(refreshToken)
      .catch(() => null);

    if (!claims) return;

    const now = new Date();

    if (allSessions) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: claims.userId, revokedAt: null },
        data: { revokedAt: now },
      });
      return;
    }

    await this.revokeFamily(claims.familyId, now);
  }

  /**
   * Drops refresh tokens that are past their expiry.
   *
   * Rows have to survive their own expiry long enough for a replay to be
   * noticed — a deleted row and a revoked row look the same to `refresh`, and
   * both are refused. Once expired, though, the row can prove nothing.
   */
  async pruneExpired(): Promise<number> {
    const { count } = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    return count;
  }

  /** Burns an entire sign-in lineage — the response to a replayed token. */
  private async revokeFamily(familyId: string, at: Date): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: at },
    });
  }

  private async assemble(
    account: AuthAccount,
    refreshToken: string,
  ): Promise<AuthSession> {
    const user = toAuthUser(account);
    const access = await this.tokens.issueAccessToken({
      id: account.id,
      name: account.name,
      email: account.email,
      roleId: account.roleId,
      roleName: account.roleName,
    });

    return {
      accessToken: access.token,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: access.expiresIn,
      user,
    };
  }
}
