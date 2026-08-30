import { z } from 'zod';
import { PaymentMethodEnum } from '../invoice/invoice.schema';

/**
 * Clinic settings live in a key/value table, so the typed surface is a fixed
 * record of the keys the settings screen edits rather than a model per field.
 * Everything is stored as a string and coerced back here.
 */
export const ClinicSettingsSchema = z.object({
  clinicName: z.string().min(1, 'Clinic name is required'),
  clinicAddress: z.string().nullable().optional(),
  clinicPhone: z.string().nullable().optional(),
  clinicEmail: z.string().nullable().optional(),
  openingHours: z.string().nullable().optional(),

  /** Invoice identifiers are `{prefix}-{seq padded to 6}`. */
  invoicePrefix: z.string().min(1, 'Prefix is required'),
  invoiceNextNumber: z.coerce.number().int().min(1),
  defaultTaxId: z.string().nullable().optional(),
  defaultPaymentMethod: PaymentMethodEnum,

  /** Products at or below this many dispensing units need restocking. */
  reorderPoint: z.coerce.number().int().min(0),
  currency: z.string().min(1),

  /**
   * Whether a finished visit's usage can still be edited. Locking is what
   * makes usage a trustworthy audit trail behind stock movements.
   */
  lockUsageOnFinish: z.enum(['always', 'admin-can-unlock']),
  /** What happens when a patient in the visit has no medical record. */
  emptyRecordGuard: z.enum(['warn', 'block', 'off']),
});

export type ClinicSettings = z.infer<typeof ClinicSettingsSchema>;
export const UpdateClinicSettingsSchema = ClinicSettingsSchema.partial();
export type UpdateClinicSettings = z.infer<typeof UpdateClinicSettingsSchema>;
