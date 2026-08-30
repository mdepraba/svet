import { Injectable } from '@nestjs/common';
import {
  ClinicSettings,
  ClinicSettingsSchema,
  UpdateClinicSettings,
} from '@svet-monorepo/schemas';
import { PrismaService } from '@/shared/prisma.service';

/**
 * Clinic settings are a key/value table, so this service is the one place that
 * knows the key names and the defaults. Everything above it sees a typed
 * `ClinicSettings` object.
 */
const DEFAULTS: ClinicSettings = {
  clinicName: 'SVET Vet Clinic',
  clinicAddress: null,
  clinicPhone: null,
  clinicEmail: null,
  openingHours: null,
  invoicePrefix: 'INV',
  invoiceNextNumber: 1,
  defaultTaxId: null,
  defaultPaymentMethod: 'CASH',
  reorderPoint: 5,
  currency: 'IDR',
  lockUsageOnFinish: 'always',
  emptyRecordGuard: 'warn',
};

@Injectable()
export class SettingService {
  constructor(private readonly prisma: PrismaService) {}

  async read(): Promise<ClinicSettings> {
    const rows = await this.prisma.setting.findMany({
      where: { deletedAt: null },
    });

    const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]));

    // Parse rather than spread: every stored value is a string, and the schema
    // coerces the numeric keys back to numbers.
    return ClinicSettingsSchema.parse({ ...DEFAULTS, ...stored });
  }

  async update(input: UpdateClinicSettings): Promise<ClinicSettings> {
    const entries = Object.entries(input).filter(
      ([, value]) => value !== undefined,
    );

    await this.prisma.$transaction(
      entries.map(([key, value]) =>
        this.prisma.setting.upsert({
          where: { key },
          create: { key, value: String(value ?? '') },
          update: { value: String(value ?? ''), deletedAt: null },
        }),
      ),
    );

    return await this.read();
  }

  /**
   * Reserves the next invoice number and returns the formatted identifier,
   * e.g. `INV-000123`. The read and the increment share one transaction so two
   * concurrent checkouts cannot be handed the same number.
   */
  async nextInvoiceIdentifier(): Promise<string> {
    return await this.prisma.$transaction(async (tx) => {
      const prefixRow = await tx.setting.findUnique({
        where: { key: 'invoicePrefix' },
      });
      const numberRow = await tx.setting.findUnique({
        where: { key: 'invoiceNextNumber' },
      });

      const prefix = prefixRow?.value ?? DEFAULTS.invoicePrefix;
      const current = Number(numberRow?.value ?? DEFAULTS.invoiceNextNumber);
      const next = Number.isFinite(current) ? current : 1;

      await tx.setting.upsert({
        where: { key: 'invoiceNextNumber' },
        create: { key: 'invoiceNextNumber', value: String(next + 1) },
        update: { value: String(next + 1) },
      });

      return `${prefix}-${String(next).padStart(6, '0')}`;
    });
  }
}
