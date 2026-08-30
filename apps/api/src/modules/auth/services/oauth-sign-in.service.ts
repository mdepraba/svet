import { Inject, Injectable } from '@nestjs/common';
import type { AuthSession } from '@svet-monorepo/schemas';

import { AUTH_CONFIG, type AuthConfig } from '../auth.config';
import {
  IDENTITY_PROVIDER_REGISTRY,
  type ExternalIdentity,
  type IdentityProviderRegistryPort,
} from '../infrastructure/identity-provider.port';
import {
  TOKEN_ISSUER,
  type TokenIssuerPort,
} from '../infrastructure/token-issuer.port';
import { AccountService } from './account.service';
import {
  InvalidSessionError,
  ProviderEmailMissingError,
  ProviderEmailUnverifiedError,
  RoleUnavailableError,
} from './auth.errors';
import { type AuthAccount, assertCanStartSession, normalizeEmail } from './auth.rules';
import { SessionService } from './session.service';

export type CompletedOAuthSignIn = {
  session: AuthSession;
  /** Carried through from the state, for the controller to redirect to. */
  redirectTo: string | null;
  /** True when this round trip attached the provider to an existing account. */
  linkedToExistingAccount: boolean;
};

/**
 * The provider door, and the only place the account-linking rule lives.
 *
 * Nothing here knows what Google is: it asks the registry for a provider by
 * name and talks to it through `IdentityProviderPort`.
 */
@Injectable()
export class OAuthSignInService {
  constructor(
    @Inject(IDENTITY_PROVIDER_REGISTRY)
    private readonly providers: IdentityProviderRegistryPort,
    @Inject(TOKEN_ISSUER) private readonly tokens: TokenIssuerPort,
    private readonly accounts: AccountService,
    private readonly sessions: SessionService,
    @Inject(AUTH_CONFIG) private readonly config: AuthConfig,
  ) {}

  /** Which providers this environment can actually offer. */
  availableProviders(): string[] {
    return this.providers.names();
  }

  /** Step one: work out where to send the browser. */
  async start(input: {
    provider: string;
    redirectTo: string | null;
    callbackUri: string;
  }): Promise<string> {
    const provider = this.providers.get(input.provider);

    const state = await this.tokens.issueOAuthState({
      provider: provider.name,
      redirectTo: input.redirectTo,
    });

    return provider.buildAuthorizationUrl({
      state,
      redirectUri: input.callbackUri,
    });
  }

  /**
   * Step two: the provider sent the person back.
   *
   * Three cases, in order:
   *
   *   1. The provider account is already known — sign that user in.
   *   2. It is new, but a local account holds the same *verified* email —
   *      attach the provider to that account. This is what makes "I registered
   *      with my Google address and a password, then came back through Google"
   *      land on one account instead of two.
   *   3. Nothing matches — create an account with no password, which can only
   *      ever be entered through this provider until someone sets one.
   */
  async complete(input: {
    provider: string;
    code: string;
    state: string;
    callbackUri: string;
  }): Promise<CompletedOAuthSignIn> {
    const provider = this.providers.get(input.provider);
    const state = await this.tokens.verifyOAuthState(input.state);

    // A state minted for one provider must not be spent at another.
    if (state.provider !== provider.name) {
      throw new InvalidSessionError(
        'That sign-in request does not belong to this provider. Start again.',
      );
    }

    const identity = await provider.exchangeCode({
      code: input.code,
      redirectUri: input.callbackUri,
    });

    const known = await this.accounts.findByExternalIdentity(
      identity.provider,
      identity.subject,
    );

    if (known) {
      assertCanStartSession(known);

      return {
        session: await this.sessions.issueFor(known),
        redirectTo: state.redirectTo,
        linkedToExistingAccount: false,
      };
    }

    const { account, linked } = await this.adopt(identity);
    assertCanStartSession(account);

    return {
      session: await this.sessions.issueFor(account),
      redirectTo: state.redirectTo,
      linkedToExistingAccount: linked,
    };
  }

  /** Cases 2 and 3: link to an existing account, or open a new one. */
  private async adopt(
    identity: ExternalIdentity,
  ): Promise<{ account: AuthAccount; linked: boolean }> {
    if (!identity.email) {
      throw new ProviderEmailMissingError(identity.provider);
    }

    const email = normalizeEmail(identity.email);
    const attachment = {
      provider: identity.provider,
      subject: identity.subject,
      email,
    };

    const existing = await this.accounts.findByEmail(email);

    if (existing) {
      // The load-bearing check. Without it, anyone who can set an unverified
      // address at a provider we trust could walk into a colleague's account.
      if (!identity.emailVerified) {
        throw new ProviderEmailUnverifiedError(identity.provider);
      }

      assertCanStartSession(existing);

      return {
        account: await this.accounts.linkIdentity(existing.id, attachment),
        linked: true,
      };
    }

    const roleId = await this.accounts.findRoleIdByName(
      this.config.defaultRoleName,
    );
    if (!roleId) throw new RoleUnavailableError(this.config.defaultRoleName);

    return {
      account: await this.accounts.create({
        name: identity.displayName?.trim() || email,
        email,
        passwordHash: null,
        roleId,
        identity: attachment,
      }),
      linked: false,
    };
  }
}
