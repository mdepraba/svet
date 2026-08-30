import type { AuthProvider, AuthUser } from '@svet-monorepo/schemas';

import { AccountDeactivatedError } from './auth.errors';

/**
 * The auth rules, as pure functions. No framework imports, no Prisma, no
 * `this` — every one of them is a plain input-to-output check that the write
 * paths in this folder call before they commit to anything.
 */

/** The name of the local credential, as opposed to an external provider. */
export const PASSWORD_METHOD = 'password';

/**
 * An account as auth cares about it: enough to decide whether this person may
 * start a session, and nothing else. `AccountService` is what produces one.
 */
export type AuthAccount = {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  /** `null` for an account that only ever arrives through a provider. */
  passwordHash: string | null;
  /** Soft-delete marker; a deactivated account cannot start a session. */
  deactivatedAt: Date | null;
  /** Names of the identity providers already linked to this account. */
  linkedProviders: readonly string[];
};

/**
 * Email addresses are matched case-insensitively throughout auth. Google hands
 * back `Ada@Example.com` for an account registered here as `ada@example.com`,
 * and those have to land on the same user.
 */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function hasPassword(account: AuthAccount): boolean {
  return account.passwordHash !== null && account.passwordHash !== '';
}

export function isLinkedTo(account: AuthAccount, provider: string): boolean {
  return account.linkedProviders.includes(provider);
}

/**
 * The gate every sign-in path passes through. Deactivating a staff account has
 * to end access no matter which door the person knocks on — password, provider,
 * or a refresh of a session opened before the deactivation.
 */
export function assertCanStartSession(account: AuthAccount): void {
  if (account.deactivatedAt !== null) throw new AccountDeactivatedError();
}

/**
 * Every way this person can get in. `password` first when they have one, so
 * the UI can lead with the credential they set up themselves.
 */
export function signInMethods(account: AuthAccount): string[] {
  return [
    ...(hasPassword(account) ? [PASSWORD_METHOD] : []),
    ...account.linkedProviders,
  ];
}

/** What the API is allowed to say about a signed-in person. Never the hash. */
export function toAuthUser(account: AuthAccount): AuthUser {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    roleId: account.roleId,
    roleName: account.roleName,
    // Safe: provider names come from the registry, and the schema's enum is
    // the list of providers this workspace registers.
    providers: signInMethods(account) as AuthProvider[],
  };
}
