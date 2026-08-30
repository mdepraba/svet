import type { AuthenticatedPrincipal } from '../contracts';

export const TOKEN_ISSUER = Symbol('TOKEN_ISSUER');

export type IssuedAccessToken = {
  token: string;
  /** Seconds until it expires. */
  expiresIn: number;
};

export type IssuedRefreshToken = {
  token: string;
  tokenId: string;
  /** Groups every token descended from one sign-in. */
  familyId: string;
  /**
   * What gets persisted instead of the token itself, so a leaked database
   * cannot be replayed as a session.
   */
  fingerprint: string;
  expiresAt: Date;
};

export type VerifiedRefreshToken = {
  userId: string;
  /** This token's own id — the row it maps to in `refresh_token`. */
  tokenId: string;
  familyId: string;
  fingerprint: string;
};

export type OAuthState = {
  provider: string;
  /** Where in the app to land afterwards, or `null` for the default. */
  redirectTo: string | null;
};

/**
 * Mints and checks the three signed things auth deals in: access tokens,
 * refresh tokens, and the `state` that rides through a provider.
 *
 * Ported on the second ground — it makes tests meaningfully simpler. Every
 * expiry, rotation, and replay rule turns on what this hands back, and a fake
 * that returns predictable tokens is the difference between testing those
 * rules and not. JWT is an implementation detail behind it: nothing in
 * `services/` names an algorithm, a secret, or a claim abbreviation.
 *
 * Verification failures surface as `InvalidSessionError`, never as a library
 * error type.
 */
export interface TokenIssuerPort {
  issueAccessToken(principal: AuthenticatedPrincipal): Promise<IssuedAccessToken>;
  verifyAccessToken(token: string): Promise<AuthenticatedPrincipal>;

  /**
   * Omit `familyId` for a fresh sign-in; pass the existing one when rotating,
   * so the whole chain stays revocable as a unit.
   */
  issueRefreshToken(input: {
    userId: string;
    familyId?: string;
  }): Promise<IssuedRefreshToken>;

  verifyRefreshToken(token: string): Promise<VerifiedRefreshToken>;

  issueOAuthState(state: OAuthState): Promise<string>;
  verifyOAuthState(raw: string): Promise<OAuthState>;
}
