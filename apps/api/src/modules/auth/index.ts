/**
 * The only door into this module. Keep it poor.
 *
 * Services, DTOs, controllers, Prisma types, and the identity-provider port
 * all stay inside. A consumer gets the module, the in-process offering, and
 * the contract type that offering speaks in — nothing more.
 */
export { AuthModule } from './auth.module';
export { AuthPort } from './ports/auth.port';
export type { AuthenticatedPrincipal } from './contracts';
