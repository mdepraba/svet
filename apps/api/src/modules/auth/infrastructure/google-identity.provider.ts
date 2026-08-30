import type { GoogleConfig } from '../auth.config';
import { IdentityProviderFailedError } from '../services/auth.errors';
import type {
  AuthorizationCodeExchange,
  AuthorizationUrlRequest,
  ExternalIdentity,
  IdentityProviderPort,
} from './identity-provider.port';

const AUTHORIZATION_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo';

/** Enough for a stable id, an address, and a display name. Nothing more. */
const SCOPES = 'openid email profile';

const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Google, behind `IdentityProviderPort`.
 *
 * The plain authorization-code flow over `fetch` — no passport strategy, no
 * SDK. That keeps the dependency surface at zero and, more to the point, keeps
 * everything Google-shaped inside this one file. The use cases never learn
 * that `sub`, `id_token`, or `email_verified` exist.
 */
export class GoogleIdentityProvider implements IdentityProviderPort {
  readonly name = 'google';

  constructor(private readonly config: GoogleConfig) {}

  buildAuthorizationUrl(request: AuthorizationUrlRequest): string {
    const url = new URL(AUTHORIZATION_ENDPOINT);

    url.search = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: request.redirectUri,
      response_type: 'code',
      scope: SCOPES,
      state: request.state,
      // Without this, a person already signed into Google is pushed straight
      // through as that account with no way to pick a different one.
      prompt: 'select_account',
    }).toString();

    return url.toString();
  }

  async exchangeCode(
    exchange: AuthorizationCodeExchange,
  ): Promise<ExternalIdentity> {
    return this.fetchIdentity(await this.redeemCode(exchange));
  }

  private async redeemCode(
    exchange: AuthorizationCodeExchange,
  ): Promise<string> {
    const response = await this.send(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: exchange.code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        // Google checks this matches the one the code was issued against.
        redirect_uri: exchange.redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    const payload = await readJson(response);

    if (!response.ok || typeof payload?.access_token !== 'string') {
      throw new IdentityProviderFailedError(
        this.name,
        describe(payload) ?? `token endpoint returned ${response.status}`,
      );
    }

    return payload.access_token;
  }

  /** The one place Google's field names are translated into ours. */
  private async fetchIdentity(accessToken: string): Promise<ExternalIdentity> {
    const response = await this.send(USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const payload = await readJson(response);

    if (!response.ok || typeof payload?.sub !== 'string') {
      throw new IdentityProviderFailedError(
        this.name,
        describe(payload) ?? `userinfo returned ${response.status}`,
      );
    }

    return {
      provider: this.name,
      subject: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : null,
      // Google sends this as a boolean, but has historically sent the string
      // "true" on some endpoints. Both are accepted; anything else is a no.
      emailVerified:
        payload.email_verified === true || payload.email_verified === 'true',
      displayName: typeof payload.name === 'string' ? payload.name : null,
    };
  }

  /** Network faults become the port's error type, not an undecorated throw. */
  private async send(url: string, init: RequestInit): Promise<Response> {
    try {
      return await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      throw new IdentityProviderFailedError(
        this.name,
        error instanceof Error ? error.message : 'the request failed',
      );
    }
  }
}

type JsonObject = Record<string, unknown>;

async function readJson(response: Response): Promise<JsonObject | null> {
  return response
    .json()
    .then((value: unknown) => (isJsonObject(value) ? value : null))
    .catch(() => null);
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null;
}

/** Google puts the useful part of a failure in one of these two fields. */
function describe(payload: JsonObject | null): string | null {
  if (!payload) return null;

  if (typeof payload.error_description === 'string') {
    return payload.error_description;
  }

  return typeof payload.error === 'string' ? payload.error : null;
}
