import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Blueprint, Kicker } from '@/components/industry/Blueprint';
import { PageHead } from '@/components/industry/PageHead';
import { SegFilter } from '@/components/industry/Toolbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { taxes } from '@/features/catalog/queries/catalogResource';
import {
  settingsOptions,
  useSettings,
  useUpdateSettings,
} from '@/features/settings/queries/settingsResource';
import type { ClinicSettings } from '@svet-monorepo/schemas';

const TAX_PARAMS = { limit: 50, sortBy: 'name', sortOrder: 'asc' } as const;

const LOCK_OPTIONS = [
  { value: 'always', label: 'Always lock' },
  { value: 'admin-can-unlock', label: 'Admin can unlock' },
] as const;

const GUARD_OPTIONS = [
  { value: 'warn', label: 'Warn' },
  { value: 'block', label: 'Block' },
  { value: 'off', label: 'Off' },
] as const;

const PAYMENT_OPTIONS = ['CASH', 'QRIS', 'TRANSFER'] as const;

export const Route = createFileRoute('/_app/settings')({
  staticData: { breadcrumbTitle: 'Settings' },
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(settingsOptions()),
  component: SettingsPage,
});

function SettingsPage() {
  const { data: stored } = useSettings();
  const { data: taxList } = useQuery(taxes.listOptions(TAX_PARAMS));
  const update = useUpdateSettings();

  const [draft, setDraft] = useState<ClinicSettings | null>(stored ?? null);

  // A save returns the re-read settings; adopt them so the form shows what is
  // stored rather than what was typed.
  useEffect(() => {
    if (stored) setDraft(stored);
  }, [stored]);

  if (!draft) return null;

  const set = <K extends keyof ClinicSettings>(
    key: K,
    value: ClinicSettings[K],
  ) => setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));

  const nextIdentifier = `${draft.invoicePrefix}-${String(
    draft.invoiceNextNumber,
  ).padStart(6, '0')}`;

  function handleSave() {
    if (!draft) return;
    update.mutate(draft, {
      onSuccess: () => toast.success('Settings saved'),
      onError: (error) =>
        toast.error(
          error instanceof Error ? error.message : 'Could not save settings',
        ),
    });
  }

  return (
    <div className="flex h-full flex-col gap-3.5">
      <PageHead
        kicker="Clinic-wide configuration"
        title="Settings"
        actions={
          <Button onClick={handleSave} disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save settings'}
          </Button>
        }
      />

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <Blueprint className="p-3">
          <Kicker className="mb-2.5">Clinic identity</Kicker>
          <div className="flex flex-col gap-2.5">
            <Field label="Clinic name">
              <Input
                className="h-9"
                value={draft.clinicName}
                onChange={(event) => set('clinicName', event.target.value)}
              />
            </Field>
            <Field label="Address">
              <Input
                className="h-9"
                value={draft.clinicAddress ?? ''}
                onChange={(event) => set('clinicAddress', event.target.value)}
              />
            </Field>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <Field label="Phone">
                <Input
                  className="h-9"
                  value={draft.clinicPhone ?? ''}
                  onChange={(event) => set('clinicPhone', event.target.value)}
                />
              </Field>
              <Field label="Opening hours">
                <Input
                  className="h-9"
                  placeholder="08:00 – 20:00"
                  value={draft.openingHours ?? ''}
                  onChange={(event) => set('openingHours', event.target.value)}
                />
              </Field>
            </div>
          </div>
        </Blueprint>

        <Blueprint className="p-3">
          <Kicker className="mb-2.5">Invoicing</Kicker>
          <div className="flex flex-col gap-2.5">
            <div className="grid gap-2.5 sm:grid-cols-[1fr_140px]">
              <Field label="Invoice prefix">
                <Input
                  className="h-9"
                  value={draft.invoicePrefix}
                  onChange={(event) => set('invoicePrefix', event.target.value)}
                />
              </Field>
              <Field label="Next number">
                <Input
                  className="h-9 tabular-nums"
                  inputMode="numeric"
                  value={draft.invoiceNextNumber}
                  onChange={(event) =>
                    set(
                      'invoiceNextNumber',
                      Math.max(1, Number(event.target.value) || 1),
                    )
                  }
                />
              </Field>
            </div>
            <p className="text-ink-600 -mt-1 text-[11.5px]">
              Next invoice will be numbered{' '}
              <span className="tabular-nums">{nextIdentifier}</span>.
            </p>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <Field label="Default tax">
                <Select
                  value={draft.defaultTaxId ?? 'none'}
                  onValueChange={(value) =>
                    set('defaultTaxId', value === 'none' ? null : value)
                  }
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No default</SelectItem>
                    {(taxList?.data ?? []).map((tax) => (
                      <SelectItem key={tax.id} value={tax.id}>
                        {tax.name} {tax.rate}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Default payment">
                <Select
                  value={draft.defaultPaymentMethod}
                  onValueChange={(value) =>
                    set(
                      'defaultPaymentMethod',
                      value as ClinicSettings['defaultPaymentMethod'],
                    )
                  }
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_OPTIONS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Low-stock reorder point (dispensing units)">
              <Input
                className="h-9 tabular-nums"
                inputMode="numeric"
                value={draft.reorderPoint}
                onChange={(event) =>
                  set(
                    'reorderPoint',
                    Math.max(0, Number(event.target.value) || 0),
                  )
                }
              />
            </Field>
          </div>
        </Blueprint>

        <Blueprint className="p-3 lg:col-span-2">
          <Kicker className="mb-2.5">Clinical rules</Kicker>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-[13px]">
                Lock medical usage when a visit finishes
              </div>
              <p className="text-ink-600 mb-2 text-[11.5px]">
                Recommended. Usage becomes the permanent audit trail behind
                stock movements.
              </p>
              <SegFilter
                name="lock-usage"
                value={draft.lockUsageOnFinish}
                options={LOCK_OPTIONS}
                onChange={(value) => set('lockUsageOnFinish', value)}
              />
            </div>
            <div>
              <div className="mb-1 text-[13px]">
                Warn before invoicing an empty record
              </div>
              <p className="text-ink-600 mb-2 text-[11.5px]">
                Shows the guard dialog when a patient in the visit has no
                medical record.
              </p>
              <SegFilter
                name="empty-record-guard"
                value={draft.emptyRecordGuard}
                options={GUARD_OPTIONS}
                onChange={(value) => set('emptyRecordGuard', value)}
              />
            </div>
          </div>
        </Blueprint>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="text-ink-700 mb-1.5 block text-xs">{label}</span>
      {children}
    </label>
  );
}
