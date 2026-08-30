/**
 * Every way authentication can refuse, expressed without HTTP, Nest, or Prisma
 * anywhere in sight. `controllers/auth-error.filter.ts` is the only place that
 * knows a status code exists.
 */
export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_DEACTIVATED'
  | 'EMAIL_ALREADY_REGISTERED'
  | 'UNKNOWN_IDENTITY_PROVIDER'
  | 'IDENTITY_PROVIDER_FAILED'
  | 'PROVIDER_EMAIL_MISSING'
  | 'PROVIDER_EMAIL_UNVERIFIED'
  | 'INVALID_SESSION'
  | 'SESSION_REUSED'
  | 'NOT_AUTHENTICATED'
  | 'ROLE_UNAVAILABLE';

export abstract class AuthError extends Error {
  abstract readonly code: AuthErrorCode;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/**
 * Wrong password, unknown email, or an email that exists but cannot use a
 * password — all one error on purpose, so the endpoint cannot be used to find
 * out which addresses have accounts.
 */
export class InvalidCredentialsError extends AuthError {
  readonly code = 'INVALID_CREDENTIALS';

  constructor() {
    super('That email and password do not match an account.');
  }
}

export class AccountDeactivatedError extends AuthError {
  readonly code = 'ACCOUNT_DEACTIVATED';

  constructor() {
    super('This account has been deactivated. Ask an admin to restore it.');
  }
}

export class EmailAlreadyRegisteredError extends AuthError {
  readonly code = 'EMAIL_ALREADY_REGISTERED';

  constructor() {
    super('An account already exists for that email. Sign in instead.');
  }
}

export class UnknownIdentityProviderError extends AuthError {
  readonly code = 'UNKNOWN_IDENTITY_PROVIDER';

  constructor(provider: string) {
    super(`No identity provider named "${provider}" is configured.`);
  }
}

export class IdentityProviderFailedError extends AuthError {
  readonly code = 'IDENTITY_PROVIDER_FAILED';

  constructor(provider: string, detail: string) {
    super(`${provider} could not complete the sign-in: ${detail}`);
  }
}

export class ProviderEmailMissingError extends AuthError {
  readonly code = 'PROVIDER_EMAIL_MISSING';

  constructor(provider: string) {
    super(`${provider} did not share an email address for this account.`);
  }
}

/**
 * The linking rule's teeth. An account is only ever joined to an existing one
 * on a matching email the provider has *verified* — otherwise anyone able to
 * set an unverified address at any provider could claim someone else's account.
 */
export class ProviderEmailUnverifiedError extends AuthError {
  readonly code = 'PROVIDER_EMAIL_UNVERIFIED';

  constructor(provider: string) {
    super(
      `${provider} has not verified that email address, so it cannot be linked to an existing account.`,
    );
  }
}

export class InvalidSessionError extends AuthError {
  readonly code = 'INVALID_SESSION';

  constructor(message = 'Your session is no longer valid. Sign in again.') {
    super(message);
  }
}

/** A refresh token was presented after it had already been rotated away. */
export class SessionReusedError extends AuthError {
  readonly code = 'SESSION_REUSED';

  constructor() {
    super(
      'This session was already refreshed elsewhere and has been ended for safety. Sign in again.',
    );
  }
}

export class NotAuthenticatedError extends AuthError {
  readonly code = 'NOT_AUTHENTICATED';

  constructor(message = 'Sign in to continue.') {
    super(message);
  }
}

/** Self-registration needs a role to hand out and could not find one. */
export class RoleUnavailableError extends AuthError {
  readonly code = 'ROLE_UNAVAILABLE';

  constructor(roleName: string) {
    super(
      `No "${roleName}" role exists to assign to new accounts. Create it first.`,
    );
  }
}
