/**
 * What the auth module offers other modules, at the type level.
 *
 * Hand-written and deliberately narrow: no Prisma types, no DTO classes, and
 * nothing shaped by what a screen happens to display. A consumer gets who the
 * caller is and nothing more.
 */
export type AuthenticatedPrincipal = {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
};
