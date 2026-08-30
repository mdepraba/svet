import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

import { AUTH_CONFIG, type AuthConfig, loadAuthConfig } from './auth.config';
import { AuthController } from './controllers/auth.controller';
import { AuthErrorFilter } from './controllers/auth-error.filter';
import { GoogleIdentityProvider } from './infrastructure/google-identity.provider';
import { IDENTITY_PROVIDER_REGISTRY } from './infrastructure/identity-provider.port';
import { IdentityProviderRegistry } from './infrastructure/identity-provider.registry';
import { JwtTokenIssuer } from './infrastructure/jwt-token.issuer';
import { TOKEN_ISSUER } from './infrastructure/token-issuer.port';
import { AuthPort } from './ports/auth.port';
import { AccountService } from './services/account.service';
import { OAuthSignInService } from './services/oauth-sign-in.service';
import { SessionPruneService } from './services/session-prune.service';
import { SessionService } from './services/session.service';
import { SignInService } from './services/sign-in.service';

/**
 * The composition root.
 *
 * Two technology ports exist in this module, and each can name the ground that
 * justified it:
 *
 * - `IDENTITY_PROVIDER_REGISTRY` — the implementation is expected to change,
 *   it makes tests possible at all, and it hides a foreign concept. Three for
 *   three. **Swapping Google is the two lines in the factory below**: write a
 *   class satisfying `IdentityProviderPort` and list it. Nothing in
 *   `services/` or `controllers/` names a provider.
 * - `TOKEN_ISSUER` — testability. Expiry, rotation, and replay rules all turn
 *   on what it returns.
 *
 * Deliberately left concrete: `PrismaService` (one implementation, forever),
 * the scrypt password helpers in `@/common/utils/password.util` (pure
 * functions), the clock, and UUID generation.
 */
@Module({
  // Registered bare: secrets and lifetimes differ per token kind and are
  // passed at each call, so there is no single module-wide signing config.
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    { provide: AUTH_CONFIG, useFactory: () => loadAuthConfig(process.env) },

    { provide: TOKEN_ISSUER, useClass: JwtTokenIssuer },
    {
      provide: IDENTITY_PROVIDER_REGISTRY,
      inject: [AUTH_CONFIG],
      useFactory: (config: AuthConfig) =>
        new IdentityProviderRegistry([
          // An environment with no Google credentials simply does not offer
          // Google, rather than offering a button that fails at the far end.
          config.google ? new GoogleIdentityProvider(config.google) : null,
        ]),
    },

    AccountService,
    SessionService,
    SignInService,
    OAuthSignInService,
    SessionPruneService,

    AuthPort,

    // Global, because the guard in `apps/api/src/guard/` raises these errors
    // on routes belonging to every other module.
    { provide: APP_FILTER, useClass: AuthErrorFilter },
  ],
  // The only thing that leaves: the in-process offering. No service, no DTO,
  // no controller.
  exports: [AuthPort],
})
export class AuthModule {}
