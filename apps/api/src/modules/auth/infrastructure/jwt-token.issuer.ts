import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AUTH_CONFIG, type AuthConfig } from '../auth.config';
import type { AuthenticatedPrincipal } from '../contracts';
import { InvalidSessionError } from '../services/auth.errors';
import type {
  IssuedAccessToken,
  IssuedRefreshToken,
  OAuthState,
  TokenIssuerPort,
  VerifiedRefreshToken,
} from './token-issuer.port';

/** Distinguishes the token kinds so one can never stand in for another. */
const ACCESS = 'access';
const REFRESH = 'refresh';
const OAUTH_STATE = 'oauth-state';

const AUDIENCE = 'svet-client';

/**
 * The JWT implementation of `TokenIssuerPort`.
 *
 * Access and refresh tokens are signed with *different* secrets, so a leak of
 * the one used on every request does not also hand over the ability to mint
 * long-lived sessions.
 */
@Injectable()
export class JwtTokenIssuer implements TokenIssuerPort {
  constructor(
    private readonly jwt: JwtService,
    @Inject(AUTH_CONFIG) private readonly config: AuthConfig,
  ) {}

  async issueAccessToken(
    principal: AuthenticatedPrincipal,
  ): Promise<IssuedAccessToken> {
    const { secret, ttlSeconds } = this.config.accessToken;

    const token = await this.jwt.signAsync(
      {
        sub: principal.id,
        email: principal.email,
        name: principal.name,
        roleId: principal.roleId,
        role: principal.roleName,
        typ: ACCESS,
      },
      {
        secret,
        expiresIn: ttlSeconds,
        issuer: this.config.issuer,
        audience: AUDIENCE,
      },
    );

    return { token, expiresIn: ttlSeconds };
  }

  async verifyAccessToken(token: string): Promise<AuthenticatedPrincipal> {
    const payload = await this.verify(token, this.config.accessToken.secret);

    // A refresh token is also a validly signed JWT. Without this check one
    // could be presented as a bearer token and would sail straight through.
    if (payload.typ !== ACCESS) {
      throw new InvalidSessionError('That is not an access token.');
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      roleId: payload.roleId,
      roleName: payload.role,
    };
  }

  async issueRefreshToken(input: {
    userId: string;
    familyId?: string;
  }): Promise<IssuedRefreshToken> {
    const { secret, ttlSeconds } = this.config.refreshToken;

    const tokenId = randomUUID();
    const familyId = input.familyId ?? randomUUID();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    const token = await this.jwt.signAsync(
      { sub: input.userId, fid: familyId, typ: REFRESH },
      {
        secret,
        expiresIn: ttlSeconds,
        jwtid: tokenId,
        issuer: this.config.issuer,
        audience: AUDIENCE,
      },
    );

    return {
      token,
      tokenId,
      familyId,
      fingerprint: fingerprint(token),
      expiresAt,
    };
  }

  async verifyRefreshToken(token: string): Promise<VerifiedRefreshToken> {
    const payload = await this.verify(token, this.config.refreshToken.secret);

    if (payload.typ !== REFRESH || !payload.jti || !payload.fid) {
      throw new InvalidSessionError('That is not a refresh token.');
    }

    return {
      userId: payload.sub,
      tokenId: payload.jti,
      familyId: payload.fid,
      fingerprint: fingerprint(token),
    };
  }

  /**
   * The `state` parameter, as a short-lived signed token.
   *
   * Signed rather than stored, so the callback stays stateless, and carrying a
   * nonce so two sign-ins started in the same second stay distinguishable. Ten
   * minutes is long enough to pick an account and approve, short enough that a
   * leaked URL is stale by the time anyone finds it.
   */
  async issueOAuthState(state: OAuthState): Promise<string> {
    const { secret, ttlSeconds } = this.config.oauthState;

    return this.jwt.signAsync(
      {
        provider: state.provider,
        redirectTo: state.redirectTo,
        nonce: randomBytes(16).toString('base64url'),
        typ: OAUTH_STATE,
      },
      { secret, expiresIn: ttlSeconds, issuer: this.config.issuer },
    );
  }

  async verifyOAuthState(raw: string): Promise<OAuthState> {
    try {
      const payload = await this.jwt.verifyAsync(raw, {
        secret: this.config.oauthState.secret,
        issuer: this.config.issuer,
      });

      if (payload.typ !== OAUTH_STATE) throw new Error('wrong token kind');

      return {
        provider: payload.provider,
        redirectTo: payload.redirectTo ?? null,
      };
    } catch {
      throw new InvalidSessionError(
        'That sign-in link has expired or was tampered with. Start again.',
      );
    }
  }

  /** Every library failure becomes one application error, at this edge. */
  private async verify(token: string, secret: string) {
    try {
      return await this.jwt.verifyAsync(token, {
        secret,
        issuer: this.config.issuer,
        audience: AUDIENCE,
      });
    } catch {
      throw new InvalidSessionError();
    }
  }
}

/**
 * What gets stored in place of the token. SHA-256 with no salt is right here
 * and wrong for passwords: a token is 300-odd bits of signed randomness, so
 * there is no dictionary to attack and the lookup has to be exact.
 */
function fingerprint(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
