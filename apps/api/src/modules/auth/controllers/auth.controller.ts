import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { AuthSession } from '@svet-monorepo/schemas';
import type { FastifyReply } from 'fastify';

import { CurrentUser } from '@/guard/current-user.decorator';
import { Public } from '@/guard/public.decorator';
import { AUTH_CONFIG, type AuthConfig } from '../auth.config';
import type { AuthenticatedPrincipal } from '../contracts';
import { AuthPort } from '../ports/auth.port';
import { AuthError } from '../services/auth.errors';
import { OAuthSignInService } from '../services/oauth-sign-in.service';
import { SessionService } from '../services/session.service';
import { SignInService } from '../services/sign-in.service';
import {
  RefreshSessionDto,
  RegisterDto,
  SignInDto,
  SignOutDto,
} from '../dto/auth.dto';

/** Where the browser is sent once a provider round trip resolves. */
const WEB_CALLBACK_PATH = '/auth/callback';

/**
 * Passed to every `reply.redirect` explicitly. Fastify only falls back to 302
 * when no status has been set yet, and by the time a Nest handler runs one
 * has — leaving the response a 200 with a `Location` header, which no browser
 * follows.
 */
const FOUND = 302;

/**
 * The auth module's public surface, and the only part of it the outside world
 * can reach. Each method turns a request into a service call and the result
 * back into a response; no rules live in this file.
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly signInService: SignInService,
    private readonly oauth: OAuthSignInService,
    private readonly sessions: SessionService,
    private readonly auth: AuthPort,
    @Inject(AUTH_CONFIG) private readonly config: AuthConfig,
  ) {}

  /** Lets the sign-in screen render only the buttons this API can honour. */
  @Public()
  @Get('providers')
  listProviders() {
    return { password: true, identityProviders: this.oauth.availableProviders() };
  }

  @Public()
  @Post('register')
  register(@Body() input: RegisterDto): Promise<AuthSession> {
    return this.signInService.register(input);
  }

  // 200, not 201: signing in does not create a resource.
  @Public()
  @Post('login')
  @HttpCode(200)
  signIn(@Body() input: SignInDto): Promise<AuthSession> {
    return this.signInService.signIn(input);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() input: RefreshSessionDto): Promise<AuthSession> {
    return this.sessions.refresh(input.refreshToken);
  }

  /**
   * Public because a client whose access token has already expired still has
   * to be able to hand back its refresh token. The refresh token is the
   * credential here.
   */
  @Public()
  @Post('logout')
  @HttpCode(204)
  signOut(@Body() input: SignOutDto): Promise<void> {
    return this.sessions.revoke(input.refreshToken, input.allSessions);
  }

  @Get('me')
  me(@CurrentUser() principal: AuthenticatedPrincipal) {
    return this.auth.describe(principal.id);
  }

  /** Step one: bounce the browser to the provider. */
  @Public()
  @Get('oauth/:provider')
  async beginOAuth(
    @Param('provider') provider: string,
    @Query('redirect') redirect: string | undefined,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const authorizationUrl = await this.oauth.start({
      provider,
      redirectTo: safeRedirectPath(redirect),
      callbackUri: this.callbackUri(provider),
    });

    reply.redirect(authorizationUrl, FOUND);
  }

  /**
   * Step two: the provider sends the person back here.
   *
   * Unlike every other endpoint, failures redirect rather than throw — a
   * browser sitting on this URL should land back in the app with something
   * readable, not on a JSON error page.
   */
  @Public()
  @Get('oauth/:provider/callback')
  async finishOAuth(
    @Param('provider') provider: string,
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') providerError: string | undefined,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    // The person pressed Cancel on the consent screen.
    if (providerError) {
      return reply.redirect(
        this.webCallbackUrl({
          error: 'PROVIDER_DECLINED',
          error_description: `${provider} did not authorise the sign-in (${providerError}).`,
        }),
        FOUND,
      );
    }

    if (!code || !state) {
      return reply.redirect(
        this.webCallbackUrl({
          error: 'INVALID_SESSION',
          error_description: 'That sign-in link is incomplete. Start again.',
        }),
        FOUND,
      );
    }

    try {
      const result = await this.oauth.complete({
        provider,
        code,
        state,
        callbackUri: this.callbackUri(provider),
      });

      reply.redirect(
        this.webCallbackUrl({
          access_token: result.session.accessToken,
          refresh_token: result.session.refreshToken,
          token_type: result.session.tokenType,
          expires_in: String(result.session.expiresIn),
          ...(result.linkedToExistingAccount && { linked: '1' }),
          ...(result.redirectTo && { redirect_to: result.redirectTo }),
        }),
        FOUND,
      );
    } catch (error) {
      const known = error instanceof AuthError;

      if (!known) console.error('OAuth callback failed:', error);

      reply.redirect(
        this.webCallbackUrl({
          error: known ? error.code : 'IDENTITY_PROVIDER_FAILED',
          error_description: known
            ? error.message
            : 'Something went wrong finishing that sign-in.',
        }),
        FOUND,
      );
    }
  }

  /**
   * Must be byte-identical between the authorization request and the code
   * exchange — providers compare the two — which is why both sides build it
   * from here.
   */
  private callbackUri(provider: string): string {
    const name = encodeURIComponent(provider);

    return `${this.config.publicApiUrl}/auth/oauth/${name}/callback`;
  }

  /**
   * Results ride back in the URL *fragment*, never the query string: a
   * fragment is not sent to any server, so the tokens stay out of proxy logs,
   * the web app's own access logs, and `Referer` headers.
   */
  private webCallbackUrl(params: Record<string, string>): string {
    const url = new URL(WEB_CALLBACK_PATH, this.config.frontendUrl);
    url.hash = new URLSearchParams(params).toString();

    return url.toString();
  }
}

/**
 * Keeps `?redirect=` from becoming an open redirect. Only in-app paths
 * survive: anything absolute, protocol-relative, or backslash-prefixed is
 * dropped.
 */
function safeRedirectPath(raw: string | undefined): string | null {
  if (!raw) return null;

  const trimmed = raw.trim();
  const isInAppPath =
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.startsWith('/\\');

  return isInAppPath ? trimmed : null;
}
