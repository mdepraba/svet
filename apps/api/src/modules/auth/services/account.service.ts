import { Injectable } from '@nestjs/common';

import { Prisma } from '@/database/prisma/generated/client';
import { PrismaService } from '@/shared/prisma.service';
import { EmailAlreadyRegisteredError } from './auth.errors';
import { type AuthAccount, normalizeEmail } from './auth.rules';

/**
 * Every account read and write auth performs.
 *
 * `PrismaService` is used directly and deliberately un-ported: there is one
 * implementation, there always will be, and an interface over it would buy a
 * file and nothing else. The seam that earns its keep in this module is the
 * identity provider, not the database.
 *
 * What this class does own is the mapping — a Prisma row becomes an
 * `AuthAccount` here and nowhere else, so no other service sees `deletedAt` or
 * a `password` column.
 */
@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(userId: string): Promise<AuthAccount | null> {
    const row = await this.prisma.user.findUnique({
      where: { id: userId },
      select: accountSelect,
    });

    return row ? toAccount(row) : null;
  }

  async findByEmail(email: string): Promise<AuthAccount | null> {
    // `findFirst`, not `findUnique`: the unique index is case-sensitive, but
    // accounts created before this feature may hold a mixed-case address and
    // Google hands back whatever casing the person typed.
    const row = await this.prisma.user.findFirst({
      where: { email: { equals: normalizeEmail(email), mode: 'insensitive' } },
      select: accountSelect,
    });

    return row ? toAccount(row) : null;
  }

  /** The returning-visitor lookup — matches on the provider's own id. */
  async findByExternalIdentity(
    provider: string,
    subject: string,
  ): Promise<AuthAccount | null> {
    const identity = await this.prisma.authIdentity.findUnique({
      where: { provider_subject: { provider, subject } },
      select: { user: { select: accountSelect } },
    });

    return identity ? toAccount(identity.user) : null;
  }

  async create(account: {
    name: string;
    email: string;
    /** `null` for an account created by an identity provider. */
    passwordHash: string | null;
    roleId: string;
    /** Attached in the same write, so a provider sign-up is never half-created. */
    identity?: ExternalIdentityLink;
  }): Promise<AuthAccount> {
    try {
      const row = await this.prisma.user.create({
        data: {
          name: account.name,
          email: normalizeEmail(account.email),
          password: account.passwordHash,
          roleId: account.roleId,
          ...(account.identity && { identities: { create: account.identity } }),
        },
        select: accountSelect,
      });

      return toAccount(row);
    } catch (error) {
      // Two registrations for the same address landing at once. The unique
      // index is the real arbiter; translate its complaint into the language
      // the rest of the module speaks.
      if (isUniqueViolation(error)) throw new EmailAlreadyRegisteredError();
      throw error;
    }
  }

  /** The linking step: joins an external account to a user that already exists. */
  async linkIdentity(
    userId: string,
    identity: ExternalIdentityLink,
  ): Promise<AuthAccount> {
    // Idempotent: two callbacks racing for the same account both end up with
    // one identity row and a correct user, rather than one of them erroring.
    await this.prisma.authIdentity.upsert({
      where: {
        provider_subject: {
          provider: identity.provider,
          subject: identity.subject,
        },
      },
      create: { ...identity, userId },
      update: { email: identity.email },
    });

    const row = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: accountSelect,
    });

    return toAccount(row);
  }

  async updatePasswordHash(
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: passwordHash },
    });
  }

  /**
   * The role stamped on an account that signs itself up.
   *
   * Roles belong to the users module, but auth needs exactly one fact about
   * them and reaching through a module boundary for a single id would cost
   * more than it saves. Case-insensitive, so `AUTH_DEFAULT_ROLE=front-desk`
   * finds a role seeded as `FRONT-DESK`.
   */
  async findRoleIdByName(roleName: string): Promise<string | null> {
    const role = await this.prisma.role.findFirst({
      where: {
        name: { equals: roleName, mode: 'insensitive' },
        deletedAt: null,
      },
      select: { id: true },
    });

    return role?.id ?? null;
  }
}

export type ExternalIdentityLink = {
  provider: string;
  subject: string;
  email: string | null;
};

/** Everything an `AuthAccount` needs from the database, and nothing else. */
const accountSelect = {
  id: true,
  name: true,
  email: true,
  password: true,
  roleId: true,
  deletedAt: true,
  role: { select: { name: true } },
  identities: { select: { provider: true } },
} satisfies Prisma.UserSelect;

type AccountRow = Prisma.UserGetPayload<{ select: typeof accountSelect }>;

function toAccount(row: AccountRow): AuthAccount {
  return {
    id: row.id,
    name: row.name,
    email: normalizeEmail(row.email),
    roleId: row.roleId,
    roleName: row.role.name,
    passwordHash: row.password,
    deactivatedAt: row.deletedAt,
    linkedProviders: row.identities.map((identity) => identity.provider),
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}
