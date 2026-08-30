import { Inject, Injectable } from '@nestjs/common';
import type { AuthSession, Register, SignIn } from '@svet-monorepo/schemas';

import { hashPassword, verifyPassword } from '@/common/utils/password.util';
import { AUTH_CONFIG, type AuthConfig } from '../auth.config';
import { AccountService } from './account.service';
import {
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  RoleUnavailableError,
} from './auth.errors';
import { assertCanStartSession, hasPassword, normalizeEmail } from './auth.rules';
import { SessionService } from './session.service';

/**
 * The password door: opening an account, and coming back through it.
 *
 * `hashPassword` and `verifyPassword` are called straight from
 * `@/common/utils/password.util`. They are pure functions with one
 * implementation; wrapping them in an interface would be ceremony.
 */
@Injectable()
export class SignInService {
  constructor(
    private readonly accounts: AccountService,
    private readonly sessions: SessionService,
    @Inject(AUTH_CONFIG) private readonly config: AuthConfig,
  ) {}

  async register(input: Register): Promise<AuthSession> {
    const email = normalizeEmail(input.email);

    if (await this.accounts.findByEmail(email)) {
      throw new EmailAlreadyRegisteredError();
    }

    const roleId = await this.accounts.findRoleIdByName(
      this.config.defaultRoleName,
    );
    if (!roleId) throw new RoleUnavailableError(this.config.defaultRoleName);

    const account = await this.accounts.create({
      name: input.name.trim(),
      email,
      passwordHash: await hashPassword(input.password),
      roleId,
    });

    return this.sessions.issueFor(account);
  }

  async signIn(input: SignIn): Promise<AuthSession> {
    const account = await this.accounts.findByEmail(input.email);

    // Unknown email, no password on file (a provider-only account), and a
    // wrong password are all the same answer. Distinguishing them would turn
    // this endpoint into a directory of who works here and how they sign in.
    if (!account || !hasPassword(account)) throw new InvalidCredentialsError();

    const { valid, needsRehash } = await verifyPassword(
      input.password,
      account.passwordHash,
    );
    if (!valid) throw new InvalidCredentialsError();

    // Only after the password checks out, so a deactivated account is not
    // distinguishable from an unknown one to someone guessing.
    assertCanStartSession(account);

    // Rows written before hashing existed hold the password in plain text.
    // They upgrade quietly on the way past.
    if (needsRehash) {
      await this.accounts.updatePasswordHash(
        account.id,
        await hashPassword(input.password),
      );
    }

    return this.sessions.issueFor(account);
  }
}
