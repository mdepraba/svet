export const AUTH_CONFIG = Symbol('AUTH_CONFIG');

export type SignedTokenConfig = {
  secret: string;
  ttlSeconds: number;
};

export type GoogleConfig = {
  clientId: string;
  clientSecret: string;
};

export type AuthConfig = {
  issuer: string;
  accessToken: SignedTokenConfig;
  refreshToken: SignedTokenConfig;
  /** The sealed `state` parameter that survives the trip through a provider. */
  oauthState: SignedTokenConfig;
  /**
   * This API's own public origin including the global prefix, e.g.
   * `http://localhost:3000/v1`. Provider callback URLs are built from it, and
   * it has to match what is registered with the provider byte for byte.
   */
  publicApiUrl: string;
  /** Where a finished provider round trip sends the browser back to. */
  frontendUrl: string;
  defaultRoleName: string;
  /** `null` when the environment has no Google credentials configured. */
  google: GoogleConfig | null;
};

/**
 * Reads the environment once, at boot, and fails loudly rather than starting an
 * API that cannot verify a token. Everything downstream receives typed values
 * and never touches `process.env`.
 */
export function loadAuthConfig(env: NodeJS.ProcessEnv): AuthConfig {
  const accessSecret = required(env, 'JWT_ACCESS_SECRET');
  const refreshSecret = required(env, 'JWT_REFRESH_SECRET');

  return {
    issuer: env.JWT_ISSUER ?? 'svet-api',
    accessToken: {
      secret: accessSecret,
      ttlSeconds: parseDuration(env.JWT_ACCESS_TTL ?? '15m'),
    },
    refreshToken: {
      secret: refreshSecret,
      ttlSeconds: parseDuration(env.JWT_REFRESH_TTL ?? '30d'),
    },
    oauthState: {
      // Its own secret when one is given, otherwise derived from the refresh
      // secret — a state token is short-lived and never leaves the round trip.
      secret: env.OAUTH_STATE_SECRET ?? `${refreshSecret}:oauth-state`,
      ttlSeconds: parseDuration(env.OAUTH_STATE_TTL ?? '10m'),
    },
    publicApiUrl: trimTrailingSlash(
      env.PUBLIC_API_URL ?? `http://localhost:${env.PORT ?? '3000'}/v1`,
    ),
    frontendUrl: trimTrailingSlash(
      env.FRONTEND_URL ?? 'http://localhost:4200',
    ),
    defaultRoleName: env.AUTH_DEFAULT_ROLE ?? 'FRONT-DESK',
    google:
      env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          }
        : null,
  };
}

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name];

  if (!value) {
    throw new Error(
      `${name} is not set. Auth cannot sign or verify tokens without it — ` +
        `generate one with \`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"\` ` +
        `and add it to your .env.`,
    );
  }

  return value;
}

/** Accepts `900`, `15m`, `24h`, `30d`. Returns seconds. */
export function parseDuration(raw: string): number {
  const match = /^(\d+)\s*([smhd]?)$/.exec(raw.trim());

  if (!match) {
    throw new Error(
      `"${raw}" is not a duration. Use seconds, or a number with s/m/h/d.`,
    );
  }

  const amount = Number(match[1]);
  const unit = match[2] || 's';
  const perUnit = { s: 1, m: 60, h: 3600, d: 86400 } as const;

  return amount * perUnit[unit as keyof typeof perUnit];
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}
