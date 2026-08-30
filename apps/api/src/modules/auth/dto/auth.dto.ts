import { createZodDto } from 'nestjs-zod';
import {
  RefreshSessionSchema,
  RegisterSchema,
  SignInSchema,
  SignOutSchema,
} from '@svet-monorepo/schemas';

/**
 * Boundary validation, and the only shape-checking the controller does. The
 * use cases re-check their own invariants; these just stop malformed HTTP from
 * reaching them.
 */
export class RegisterDto extends createZodDto(RegisterSchema) {}
export class SignInDto extends createZodDto(SignInSchema) {}
export class RefreshSessionDto extends createZodDto(RefreshSessionSchema) {}
export class SignOutDto extends createZodDto(SignOutSchema) {}
