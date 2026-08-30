import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Kicker } from '@/components/industry/Blueprint';
import { Tag } from '@/components/industry/Tag';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { products as productResource } from '@/features/products/queries/productResource';
import { treatments as treatmentResource } from '@/features/treatments/queries/treatmentResource';
import { patients as patientResource } from '@/features/patients/queries/patientResource';
import { users } from '@/features/staff/queries/staffResource';
import { usePatientHistory } from '@/features/records/queries/patientHistory';
import {
  useCancelVisit,
  useFinishVisit,
  useSaveVisitDraft,
} from '@/features/visits/queries/visitResource';
import { amount, rupiah, shortTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type {
  ProductListItem,
  TreatmentListItem,
  VisitWorksheet as VisitWorksheetData,
} from '@svet-monorepo/schemas';

import {
  toSavePayload,
  useWorksheetDraft,
  type DraftDetail,
} from './useWorksheetDraft';

const CATALOG_PARAMS = {
  limit: 100,
  sortBy: 'name',
  sortOrder: 'asc',
} as const;

export function VisitWorksheet({ visit }: { visit: VisitWorksheetData }) {
  const navigate = useNavigate();
  const { details, dirty, actions } = useWorksheetDraft(visit);
  const [activeIndex, setActiveIndex] = useState(0);

  const saveDraft = useSaveVisitDraft(visit.id);
  const finish = useFinishVisit(visit.id);
  const cancel = useCancelVisit(visit.id);

  const { data: treatmentPage } = useQuery(
    treatmentResource.listOptions(CATALOG_PARAMS),
  );
  const { data: productPage } = useQuery(
    productResource.listOptions(CATALOG_PARAMS),
  );
  const { data: staffPage } = useQuery(users.listOptions(CATALOG_PARAMS));
  const { data: ownerPets } = useQuery(
    patientResource.listOptions({
      ...CATALOG_PARAMS,
      search: visit.owner.name,
    }),
  );

  const catalog = {
    treatments: treatmentPage?.data ?? [],
    products: productPage?.data ?? [],
    staff: staffPage?.data ?? [],
  };
  const treatmentById = new Map(
    catalog.treatments.map((treatment) => [treatment.id, treatment]),
  );
  const productById = new Map(
    catalog.products.map((product) => [product.id, product]),
  );

  // The worksheet payload names each patient; the catalog lookups only cover
  // what the vet can newly add.
  const patientByDetail = new Map(
    visit.visitDetails.map((detail) => [detail.patientId, detail.patient]),
  );
  const vetNameById = new Map(
    visit.visitDetails.map((detail) => [detail.vetId, detail.vet.name]),
  );
  for (const member of catalog.staff) vetNameById.set(member.id, member.name);

  const isLocked = visit.status === 'FINISHED' || visit.status === 'CANCELLED';
  const active = details[activeIndex];

  const priceOfTreatment = (treatmentId: string) =>
    Number(treatmentById.get(treatmentId)?.grossPrice ?? 0);
  const priceOfProduct = (productId: string) =>
    Number(productById.get(productId)?.grossPrice ?? 0);

  const visitTotal = details.reduce(
    (sum, detail) =>
      sum +
      detail.services.reduce(
        (s, service) => s + priceOfTreatment(service.treatmentId) * service.qty,
        0,
      ) +
      detail.products.reduce(
        (s, product) => s + priceOfProduct(product.productId) * product.qty,
        0,
      ),
    0,
  );

  function handleSaveDraft() {
    saveDraft.mutate(toSavePayload(details), {
      onSuccess: () => toast.success('Draft saved — the visit stays open'),
      onError: (error) => toast.error(errorText(error, 'Could not save')),
    });
  }

  function handleFinish() {
    finish.mutate(toSavePayload(details), {
      onSuccess: (data) => {
        toast.success(`Invoice ${data.invoice.identifier} created`);
        navigate({ to: '/invoice/$id', params: { id: data.invoice.id } });
      },
      onError: (error) =>
        toast.error(errorText(error, 'Could not finish this visit')),
    });
  }

  function handleCancel() {
    cancel.mutate(undefined, {
      onSuccess: () => {
        toast.success('Visit cancelled');
        navigate({ to: '/visit' });
      },
      onError: (error) => toast.error(errorText(error, 'Could not cancel')),
    });
  }

  const isSaving = saveDraft.isPending || finish.isPending;

  return (
    // Negative margins let the tab strip and the action bar meet the shell's
    // edges, as the design draws them, without changing the shared layout.
    <div className="-m-[18px] flex h-[calc(100%+36px)] min-h-0 flex-col">
      <PatientTabs
        details={details}
        activeIndex={activeIndex}
        onSelect={setActiveIndex}
        patientByDetail={patientByDetail}
        vetNameById={vetNameById}
        visit={visit}
        isLocked={isLocked}
        addPatient={actions.addPatient}
        pets={ownerPets?.data ?? []}
        staff={catalog.staff}
      />

      {isLocked ? (
        <div className="border-border flex items-center gap-2.5 border-b bg-[color-mix(in_srgb,var(--color-accent)_6%,transparent)] px-4 py-2">
          <TriangleAlert className="text-brand-800 size-[15px] flex-none" />
          <span className="text-[12.5px]">
            This visit is {visit.status.toLowerCase()}. The record and its usage
            are locked as the audit trail behind the stock movements.
          </span>
          {visit.invoices[0] ? (
            <Link
              to="/invoice/$id"
              params={{ id: visit.invoices[0].id }}
              className="ml-auto text-xs"
            >
              Open {visit.invoices[0].identifier}
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 xl:grid-cols-[1fr_272px]">
        <div className="flex min-h-0 flex-col gap-2.5 overflow-auto px-4 py-3">
          {active ? (
            <>
              <Section index="01" title="Vitals">
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <VitalField
                    label="Temperature °C"
                    value={active.record.temperature}
                    disabled={isLocked}
                    onChange={(value) =>
                      actions.setRecordField(activeIndex, 'temperature', value)
                    }
                  />
                  <VitalField
                    label="Pulse bpm"
                    value={active.record.pulse}
                    disabled={isLocked}
                    onChange={(value) =>
                      actions.setRecordField(activeIndex, 'pulse', value)
                    }
                  />
                  <VitalField
                    label="Respiration /min"
                    value={active.record.respiration}
                    disabled={isLocked}
                    onChange={(value) =>
                      actions.setRecordField(activeIndex, 'respiration', value)
                    }
                  />
                  <VitalField
                    label="Weight kg"
                    value={active.record.weight}
                    disabled={isLocked}
                    onChange={(value) =>
                      actions.setRecordField(activeIndex, 'weight', value)
                    }
                  />
                </div>
              </Section>

              <Section index="02" title="Clinical notes">
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <NoteField
                    className="sm:col-span-2"
                    label="Anamnesis"
                    value={active.record.anamnesis}
                    disabled={isLocked}
                    onChange={(value) =>
                      actions.setRecordField(activeIndex, 'anamnesis', value)
                    }
                  />
                  <NoteField
                    label="Diagnosis"
                    value={active.record.diagnosis}
                    disabled={isLocked}
                    onChange={(value) =>
                      actions.setRecordField(activeIndex, 'diagnosis', value)
                    }
                  />
                  <NoteField
                    label="Treatment plan"
                    value={active.record.treatment}
                    disabled={isLocked}
                    onChange={(value) =>
                      actions.setRecordField(activeIndex, 'treatment', value)
                    }
                  />
                </div>
              </Section>

              <Section
                index="03"
                title="Services performed"
                action={
                  !isLocked && catalog.treatments.length > 0 ? (
                    <AddFromCatalog
                      label="Add service"
                      placeholder="Choose a service"
                      options={catalog.treatments.map((treatment) => ({
                        value: treatment.id,
                        label: `${treatment.name} · ${amount(treatment.grossPrice)}`,
                      }))}
                      onPick={(treatmentId) => {
                        const treatment = treatmentById.get(treatmentId);
                        if (treatment)
                          actions.addService(activeIndex, treatment);
                      }}
                    />
                  ) : null
                }
              >
                <ServiceList
                  detail={active}
                  detailIndex={activeIndex}
                  treatmentById={treatmentById}
                  productById={productById}
                  catalogProducts={catalog.products}
                  isLocked={isLocked}
                  actions={actions}
                />
              </Section>

              <Section
                index="04"
                title="All products used"
                action={
                  !isLocked && catalog.products.length > 0 ? (
                    <AddFromCatalog
                      label="Add product manually"
                      placeholder="Choose a product"
                      options={catalog.products.map((product) => ({
                        value: product.id,
                        label: `${product.name} · ${amount(product.grossPrice)}`,
                      }))}
                      onPick={(productId) =>
                        actions.addProduct(activeIndex, productId, null)
                      }
                    />
                  ) : null
                }
              >
                <UsageTable
                  detail={active}
                  detailIndex={activeIndex}
                  productById={productById}
                  treatmentById={treatmentById}
                  isLocked={isLocked}
                  actions={actions}
                />
              </Section>
            </>
          ) : (
            <p className="text-ink-600 m-0 py-8 text-center text-sm">
              No patient on this visit yet. Add one from the tab strip above.
            </p>
          )}
        </div>

        <PatientHistoryRail
          patientId={active?.patientId}
          patientName={
            active ? (patientByDetail.get(active.patientId)?.name ?? '') : ''
          }
        />
      </div>

      <div className="border-border bg-background flex flex-none flex-wrap items-center gap-3 border-t px-4 py-2.5">
        {!isLocked ? (
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={cancel.isPending}
          >
            Cancel visit
          </Button>
        ) : null}
        <span className="text-ink-500 text-[11.5px]">
          {isLocked
            ? 'Locked'
            : dirty
              ? 'Unsaved changes'
              : 'All changes saved'}
        </span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-ink-600 text-xs">
            Visit total{' '}
            <span className="text-foreground text-sm tabular-nums">
              {rupiah(visitTotal)}
            </span>
          </span>
          {!isLocked ? (
            <>
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSaving}
              >
                Save only
              </Button>
              <Button onClick={handleFinish} disabled={isSaving}>
                Save and make invoice
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function errorText(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

/* ── tab strip ──────────────────────────────────────────────────────────── */

function PatientTabs({
  details,
  activeIndex,
  onSelect,
  patientByDetail,
  vetNameById,
  visit,
  isLocked,
  addPatient,
  pets,
  staff,
}: {
  details: DraftDetail[];
  activeIndex: number;
  onSelect: (index: number) => void;
  patientByDetail: Map<string, { name: string; species: string }>;
  vetNameById: Map<string, string>;
  visit: VisitWorksheetData;
  isLocked: boolean;
  addPatient: (patientId: string, vetId: string) => void;
  pets: { id: string; name: string; ownerId: string }[];
  staff: { id: string; name: string }[];
}) {
  const [adding, setAdding] = useState(false);

  const unusedPets = pets.filter(
    (pet) =>
      pet.ownerId === visit.ownerId &&
      !details.some((detail) => detail.patientId === pet.id),
  );

  return (
    <div className="border-border flex flex-none flex-wrap items-stretch border-b px-4">
      {details.map((detail, index) => {
        const patient = patientByDetail.get(detail.patientId);
        const isActive = index === activeIndex;
        return (
          <button
            key={detail.id ?? `new-${detail.patientId}`}
            type="button"
            onClick={() => onSelect(index)}
            className={`-mb-px flex items-center gap-2.5 px-3.5 pt-2.5 pb-2 ${
              isActive ? 'border-primary border-b-2' : ''
            }`}
          >
            <span
              className={`font-heading text-[17px] ${isActive ? 'text-brand-800' : 'text-ink-600'}`}
            >
              {patient?.name ?? 'New patient'}
            </span>
            <span className="text-ink-500 text-[11px]">
              {[patient?.species, vetNameById.get(detail.vetId)]
                .filter(Boolean)
                .join(' · ')}
            </span>
            <Tag
              tone={detail.id ? 'neutral' : 'accent'}
              className="px-1.5 py-0.5 text-[9px]"
            >
              {detail.id ? 'SAVED' : 'NEW'}
            </Tag>
          </button>
        );
      })}

      {!isLocked ? (
        adding ? (
          <div className="flex items-center gap-2 py-1.5 pl-2">
            <Select
              onValueChange={(patientId) => {
                const vetId = details[0]?.vetId ?? staff[0]?.id;
                if (vetId) {
                  addPatient(patientId, vetId);
                  setAdding(false);
                }
              }}
            >
              <SelectTrigger className="h-8 w-48">
                <SelectValue placeholder="Which pet?" />
              </SelectTrigger>
              <SelectContent>
                {unusedPets.map((pet) => (
                  <SelectItem key={pet.id} value={pet.id}>
                    {pet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="my-1.5 ml-2"
            onClick={() => setAdding(true)}
            disabled={unusedPets.length === 0}
            title={
              unusedPets.length === 0
                ? 'Every pet on file for this owner is already on the visit'
                : undefined
            }
          >
            <Plus />
            Add patient
          </Button>
        )
      ) : null}

      <div className="ml-auto flex items-center gap-2 py-2">
        <Tag tone="outline" className="text-[9.5px]">
          {visit.visitType === 'MEDIC' ? 'MEDICAL' : 'NON-MEDICAL'}
        </Tag>
        <span className="text-ink-500 text-[11.5px]">
          {shortTime(visit.scheduleAt ?? visit.visitDate)} · {visit.owner.name}
        </span>
      </div>
    </div>
  );
}

/* ── numbered section ───────────────────────────────────────────────────── */

function Section({
  index,
  title,
  action,
  children,
}: {
  index: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="font-heading text-primary w-6 flex-none pt-4 text-[11px] tracking-[0.1em]">
        {index}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <Kicker>{title}</Kicker>
          {action}
        </div>
        {children}
      </div>
    </div>
  );
}

function VitalField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="text-ink-700 mb-1 block text-xs">{label}</span>
      <Input
        className="h-8 tabular-nums"
        inputMode="decimal"
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function NoteField({
  label,
  value,
  disabled,
  onChange,
  className,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  className?: string;
}) {
  // Grid rows stretch their items, so making the label a column and letting
  // the box grow keeps Diagnosis and Treatment plan the same height however
  // much text either one holds.
  return (
    <label className={cn('flex h-full flex-col', className)}>
      <span className="text-ink-700 mb-1 block text-xs">{label}</span>
      <Textarea
        className="min-h-[42px] flex-auto resize-none"
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function AddFromCatalog({
  label,
  placeholder,
  options,
  onPick,
}: {
  label: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onPick: (value: string) => void;
}) {
  return (
    <Select value="" onValueChange={onPick}>
      <SelectTrigger className="h-7 w-auto gap-1.5 border-transparent px-1 text-xs">
        <Plus className="size-3" />
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <div className="text-ink-600 px-2 py-1 text-[11px]">{placeholder}</div>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ── services ───────────────────────────────────────────────────────────── */

type Actions = ReturnType<typeof useWorksheetDraft>['actions'];

function ServiceList({
  detail,
  detailIndex,
  treatmentById,
  productById,
  catalogProducts,
  isLocked,
  actions,
}: {
  detail: DraftDetail;
  detailIndex: number;
  treatmentById: Map<string, TreatmentListItem>;
  productById: Map<string, ProductListItem>;
  catalogProducts: ProductListItem[];
  isLocked: boolean;
  actions: Actions;
}) {
  const [expanded, setExpanded] = useState<string | null>(
    detail.services[0]?.ref ?? null,
  );

  if (detail.services.length === 0) {
    return (
      <p className="text-ink-600 border-border m-0 border px-3 py-3 text-[12.5px]">
        No services recorded yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {detail.services.map((service) => {
        const treatment = treatmentById.get(service.treatmentId);
        const isOpen = expanded === service.ref;
        const children = detail.products
          .map((product, position) => ({ product, position }))
          .filter(({ product }) => product.treatmentRef === service.ref);

        return (
          <div key={service.ref} className="border-border border">
            <div
              className={`flex items-center gap-2.5 px-3 py-2 ${
                isOpen
                  ? 'bg-[color-mix(in_srgb,var(--color-accent)_7%,transparent)]'
                  : ''
              }`}
            >
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : service.ref)}
                aria-expanded={isOpen}
                aria-label={isOpen ? 'Collapse service' : 'Expand service'}
              >
                {isOpen ? (
                  <ChevronDown className="text-primary size-3.5" />
                ) : (
                  <ChevronRight className="size-3.5 opacity-45" />
                )}
              </button>
              <span className="font-heading text-base">
                {treatment?.name ?? 'Unknown service'}
              </span>
              <span className="text-ink-500 text-[11px]">
                {children.length === 1
                  ? '1 product'
                  : `${children.length} products`}
              </span>
              {!isLocked ? (
                <Input
                  className="h-7 w-14 text-center tabular-nums"
                  inputMode="numeric"
                  aria-label="Service quantity"
                  value={service.qty}
                  onChange={(event) =>
                    actions.setServiceQty(
                      detailIndex,
                      service.ref,
                      Number(event.target.value) || 1,
                    )
                  }
                />
              ) : (
                <span className="text-[13px] tabular-nums">×{service.qty}</span>
              )}
              <span className="ml-auto text-[13px] tabular-nums">
                {rupiah(Number(treatment?.grossPrice ?? 0) * service.qty)}
              </span>
              {!isLocked ? (
                <button
                  type="button"
                  aria-label="Remove service"
                  className="opacity-40 hover:opacity-100"
                  onClick={() =>
                    actions.removeService(detailIndex, service.ref)
                  }
                >
                  <Trash2 className="size-3.5" />
                </button>
              ) : null}
            </div>

            {isOpen ? (
              <div className="flex flex-col gap-1.5 py-2.5 pr-3 pl-9">
                <div className="text-ink-500 text-[10px] tracking-[0.1em] uppercase">
                  Products from this service
                </div>
                {children.map(({ product, position }) => {
                  const catalogProduct = productById.get(product.productId);
                  return (
                    <div
                      key={`${product.productId}-${position}`}
                      className="flex items-center gap-2.5"
                    >
                      <span className="min-w-0 flex-1 text-[13px]">
                        {catalogProduct?.name ?? 'Unknown product'}
                      </span>
                      <Tag tone="accent" className="px-1.5 py-0.5 text-[9px]">
                        FROM SERVICE
                      </Tag>
                      <QtyStepper
                        value={product.qty}
                        disabled={isLocked}
                        onChange={(qty) =>
                          actions.setProductQty(detailIndex, position, qty)
                        }
                      />
                      <span className="text-ink-500 w-14 text-right text-[11.5px]">
                        {catalogProduct?.dispensingUnit ?? ''}
                      </span>
                      {!isLocked ? (
                        <button
                          type="button"
                          aria-label="Remove product"
                          className="opacity-40 hover:opacity-100"
                          onClick={() =>
                            actions.removeProduct(detailIndex, position)
                          }
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      ) : null}
                    </div>
                  );
                })}
                {children.length === 0 ? (
                  <p className="text-ink-600 m-0 text-[12.5px]">
                    Nothing from this service yet.
                  </p>
                ) : null}
                {!isLocked && catalogProducts.length > 0 ? (
                  <div className="mt-0.5">
                    <AddFromCatalog
                      label="Add product to this service"
                      placeholder="Choose a product"
                      options={catalogProducts.map((product) => ({
                        value: product.id,
                        label: product.name,
                      }))}
                      onPick={(productId) =>
                        actions.addProduct(detailIndex, productId, service.ref)
                      }
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function QtyStepper({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="border-border flex items-center border">
      <button
        type="button"
        aria-label="Decrease quantity"
        className="px-2 py-0.5 text-[13px] opacity-60 disabled:opacity-25"
        disabled={disabled || value <= 1}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span className="border-border border-x px-2.5 py-0.5 text-[13px] tabular-nums">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        className="px-2 py-0.5 text-[13px] opacity-60 disabled:opacity-25"
        disabled={disabled}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}

/* ── flat usage roll-up ─────────────────────────────────────────────────── */

function UsageTable({
  detail,
  detailIndex,
  productById,
  treatmentById,
  isLocked,
  actions,
}: {
  detail: DraftDetail;
  detailIndex: number;
  productById: Map<string, ProductListItem>;
  treatmentById: Map<string, TreatmentListItem>;
  isLocked: boolean;
  actions: Actions;
}) {
  if (detail.products.length === 0) {
    return (
      <p className="text-ink-600 border-border m-0 border px-3 py-3 text-[12.5px]">
        No products used yet.
      </p>
    );
  }

  // Everything this patient consumes comes off the same on-hand figure, so the
  // "stock after" column has to account for the earlier rows too.
  const consumedSoFar = new Map<string, number>();

  return (
    <table className="table text-[12.5px]">
      <thead>
        <tr>
          <th>Product</th>
          <th>Source</th>
          <th className="text-right">Qty</th>
          <th>Unit</th>
          <th className="text-right">Stock after</th>
          <th className="text-right">Subtotal</th>
          <th className="w-8" />
        </tr>
      </thead>
      <tbody>
        {detail.products.map((product, position) => {
          const catalogProduct = productById.get(product.productId);
          const source = product.treatmentRef
            ? treatmentById.get(
                detail.services.find(
                  (service) => service.ref === product.treatmentRef,
                )?.treatmentId ?? '',
              )
            : null;

          const already = consumedSoFar.get(product.productId) ?? 0;
          consumedSoFar.set(product.productId, already + product.qty);

          const stockAfter =
            catalogProduct?.stock === null ||
            catalogProduct?.stock === undefined
              ? null
              : catalogProduct.stock - already - product.qty;

          const isTight = stockAfter !== null && stockAfter <= 5;

          return (
            <tr key={`${product.productId}-${position}`}>
              <td>
                {catalogProduct?.name ?? 'Unknown product'}
                {isTight ? (
                  <div className="text-brand-800 mt-0.5 flex items-center gap-1 text-[11px]">
                    <TriangleAlert className="size-3" />
                    {stockAfter !== null && stockAfter < 0
                      ? 'Not enough in stock'
                      : `Only ${stockAfter} left after this visit`}
                  </div>
                ) : null}
              </td>
              <td>
                <Tag
                  tone={source ? 'accent' : 'neutral'}
                  className="px-1.5 py-0.5 text-[9px]"
                >
                  {source ? source.name.toUpperCase() : 'MANUAL'}
                </Tag>
              </td>
              <td className="text-right tabular-nums">{product.qty}</td>
              <td>{catalogProduct?.dispensingUnit ?? '—'}</td>
              <td
                className={`text-right tabular-nums ${isTight ? 'text-brand-800' : ''}`}
              >
                {stockAfter ?? '—'}
              </td>
              <td className="text-right tabular-nums">
                {rupiah(Number(catalogProduct?.grossPrice ?? 0) * product.qty)}
              </td>
              <td>
                {!isLocked ? (
                  <button
                    type="button"
                    aria-label="Remove product"
                    className="opacity-40 hover:opacity-100"
                    onClick={() => actions.removeProduct(detailIndex, position)}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                ) : null}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ── right rail ─────────────────────────────────────────────────────────── */

function PatientHistoryRail({
  patientId,
  patientName,
}: {
  patientId: string | undefined;
  patientName: string;
}) {
  const { data: history } = usePatientHistory(patientId);
  const records = history ?? [];

  const weights = records
    .filter((record) => record.weight !== null)
    .slice(0, 5)
    .reverse()
    .map((record) => record.weight as number);

  return (
    <aside className="border-border hidden min-h-0 flex-col overflow-hidden border-l px-3 py-3 xl:flex">
      <Kicker className="mb-0.5">
        {patientName ? `${patientName} · past records` : 'Past records'}
      </Kicker>
      <div className="text-ink-500 mb-2 text-[11px]">
        {records.length === 0
          ? 'No earlier records'
          : `${records.length} ${records.length === 1 ? 'record' : 'records'} · newest first`}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-auto">
        {records.map((record, index) =>
          index === 0 ? (
            <div
              key={record.id}
              className="border-primary border-l-2 py-1.5 pl-2.5"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-sm">
                  {new Date(record.recordedAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <span className="text-[10.5px] opacity-50">
                  {record.vetName ?? ''}
                </span>
              </div>
              <div className="mt-0.5 text-xs leading-[1.45]">
                {record.diagnosis ?? record.anamnesis ?? '—'}
              </div>
              <div className="text-ink-500 mt-1 text-[10.5px]">
                {[
                  record.temperature !== null
                    ? `${record.temperature} °C`
                    : null,
                  record.pulse !== null ? `${record.pulse} bpm` : null,
                  record.weight !== null ? `${record.weight} kg` : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || '—'}
              </div>
            </div>
          ) : (
            <div
              key={record.id}
              className="border-border flex items-baseline gap-2 border-l py-1 pl-2.5"
            >
              <span className="font-heading text-[13.5px]">
                {new Date(record.recordedAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span className="text-ink-600 min-w-0 truncate text-[11.5px]">
                {record.diagnosis ?? record.anamnesis ?? '—'}
              </span>
            </div>
          ),
        )}
      </div>

      {weights.length >= 2 ? (
        <div className="mt-auto pt-3">
          <Kicker className="mb-1.5">
            Weight, last {weights.length} visits
          </Kicker>
          <WeightSparkline values={weights} />
        </div>
      ) : null}
    </aside>
  );
}

function WeightSparkline({ values }: { values: number[] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  // A flat series would divide by zero; give it a nominal band instead.
  const span = max - min || 1;

  const points = values
    .map((value, index) => {
      const x = 14 + (index * 192) / Math.max(values.length - 1, 1);
      const y = 46 - ((value - min) / span) * 32;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const last = points.split(' ').at(-1)?.split(',') ?? ['0', '0'];

  return (
    <svg
      viewBox="0 0 240 60"
      className="border-border h-14 w-full border"
      role="img"
      aria-label={`Weight over the last ${values.length} visits, ${min} to ${max} kilograms`}
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
      />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill="var(--color-accent)" />
      <text x="8" y="14" fontSize="7" fill="currentColor" opacity=".5">
        {max}
      </text>
      <text x="8" y="55" fontSize="7" fill="currentColor" opacity=".5">
        {min}
      </text>
    </svg>
  );
}
