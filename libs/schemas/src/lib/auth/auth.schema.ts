import { z } from 'zod';

/**
 * How an account proves who it is. `password` is the local credential; every
 * other value is an external identity provider the API knows how to talk to.
 *
 * Adding a provider is a matter of extending this list and registering an
 * adapter on the API side — nothing else in the contract changes.
 */
export const AuthProviderSchema = z.enum(['password', 'google']);
export type AuthProvider = z.infer<typeof AuthProviderSchema>;

/** Only the external ones — what `/auth/oauth/:provider` accepts. */
export const IdentityProviderSchema = z.enum(['google']);
export type IdentityProvider = z.infer<typeof IdentityProviderSchema>;

/**
 * The password rules, in one place. `user.schema.ts` reuses this so an admin
 * creating a staff account and a person registering themselves are held to
 * the same standard.
 */
export const PasswordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters long.' })
  .regex(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter.',
  })
  .regex(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter.',
  })
  .regex(/[0-9]/, { message: 'Password must contain at least one number.' })
  .regex(/[^a-zA-Z0-9]/, {
    message: 'Password must contain at least one special character.',
  });

export const SignInSchema = z.object({
  email: z.email('Enter the email on your staff account'),
  // Deliberately not `PasswordSchema`: an existing password is checked against
  // the stored hash, not against today's rules.
  password: z.string().min(1, 'Enter your password'),
});
export type SignIn = z.infer<typeof SignInSchema>;

export const RegisterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Invalid email format'),
  password: PasswordSchema,
});
export type Register = z.infer<typeof RegisterSchema>;

export const RefreshSessionSchema = z.object({
  refreshToken: z.string().min(1, 'Missing refresh token'),
});
export type RefreshSession = z.infer<typeof RefreshSessionSchema>;

export const SignOutSchema = z.object({
  refreshToken: z.string().min(1, 'Missing refresh token'),
  /** Ends every session this account has open, not just this browser's. */
  allSessions: z.boolean().optional(),
});
export type SignOut = z.infer<typeof SignOutSchema>;

/** Who is signed in. Never carries a password or a provider access token. */
export const AuthUserSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.string(),
  roleId: z.uuid(),
  roleName: z.string(),
  /**
   * Every way this account can sign in. One account can hold several: a person
   * who registered with a password and later came back through Google has
   * both, because the two were linked on the matching verified email.
   */
  providers: z.array(AuthProviderSchema),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

/**
 * What every successful sign-in returns, whichever door was used.
 *
 * `expiresIn` is seconds of life left on the access token, so a client can
 * refresh ahead of time instead of waiting for a 401.
 */
export const AuthSessionSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().int().positive(),
  user: AuthUserSchema,
});
export type AuthSession = z.infer<typeof AuthSessionSchema>;

/** What `GET /auth/providers` answers: the sign-in doors this API has open. */
export const AuthProvidersResponseSchema = z.object({
  password: z.boolean(),
  identityProviders: z.array(z.string()),
});
export type AuthProvidersResponse = z.infer<
  typeof AuthProvidersResponseSchema
>;
