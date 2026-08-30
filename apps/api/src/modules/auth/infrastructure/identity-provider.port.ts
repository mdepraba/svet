export const IDENTITY_PROVIDER_REGISTRY = Symbol('IDENTITY_PROVIDER_REGISTRY');

/**
 * What an identity provider tells us about the person who just authorised us.
 *
 * Deliberately the small intersection every OIDC-ish provider can satisfy — a
 * stable id, an email, and whether the provider vouches for it. A provider
 * returning more (Google's picture, a directory's department) drops the extra
 * in its own adapter rather than widening this.
 */
export type ExternalIdentity = {
  /** Which adapter produced this, e.g. `google`. */
  provider: string;
  /**
   * The provider's own immutable id for the account — Google's `sub`. Matched
   * on for returning sign-ins, because an email can be changed at the provider
   * while this cannot.
   */
  subject: string;
  email: string | null;
  /**
   * Whether the provider states it has verified the address. Account linking
   * refuses to proceed on `false`; see `ProviderEmailUnverifiedError`.
   */
  emailVerified: boolean;
  displayName: string | null;
};

export type AuthorizationUrlRequest = {
  /** Opaque, signed, short-lived — the provider hands it back untouched. */
  state: string;
  /** Where the provider sends the person once they have approved. */
  redirectUri: string;
};

export type AuthorizationCodeExchange = {
  code: string;
  /** Must be byte-identical to the one sent with the authorization request. */
  redirectUri: string;
};

/**
 * One external place a person can prove who they are.
 *
 * This port is the reason the feature exists in this shape, and it clears all
 * three grounds for an abstraction: the implementation is expected to change
 * (that was the requirement), it makes tests meaningfully simpler (nothing
 * else lets a sign-in be exercised without a browser and a real Google
 * account), and it hides a genuinely foreign concept (`sub`, `id_token`,
 * `email_verified`).
 *
 * Swapping Google for Entra ID, Okta, or a self-hosted Keycloak means writing
 * one class that satisfies these three members and naming it in
 * `auth.module.ts`. No service and no controller changes.
 */
export interface IdentityProviderPort {
  /** How this provider is named in a URL: `/auth/oauth/<name>`. */
  readonly name: string;

  /** Where to send the browser to start the flow. */
  buildAuthorizationUrl(request: AuthorizationUrlRequest): string;

  /**
   * Trades the one-time code from the callback for the person's identity.
   * Failures come back as `IdentityProviderFailedError`.
   */
  exchangeCode(exchange: AuthorizationCodeExchange): Promise<ExternalIdentity>;
}

export interface IdentityProviderRegistryPort {
  /** Throws `UnknownIdentityProviderError` when nothing is registered. */
  get(name: string): IdentityProviderPort;

  /** The providers actually configured in this environment. */
  names(): string[];
}
