import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { z } from 'zod';

import { Blueprint, Kicker } from '@/components/industry/Blueprint';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  treatments,
  useSaveTreatmentRecipe,
} from '@/features/treatments/queries/treatmentResource';
import { products } from '@/features/products/queries/productResource';
import { amount, rupiah } from '@/lib/format';
import type { TreatmentListItem } from '@svet-monorepo/schemas';

const searchSchema = z.object({
  q: z.string().default('').catch(''),
  /** Which treatment the right pane is editing. */
  selected: z.string().default('').catch(''),
});

const LIST_PARAMS = { limit: 100, sortBy: 'name', sortOrder: 'asc' } as const;
const PRODUCT_PARAMS = {
  limit: 100,
  sortBy: 'name',
  sortOrder: 'asc',
} as const;

export const Route = createFileRoute('/_app/treatment/')({
  staticData: { breadcrumbTitle: 'Treatment' },
  validateSearch: searchSchema,
  loader: ({ context: { queryClient } }) =>
    treatments.ensureList(queryClient, LIST_PARAMS),
  component: TreatmentIndexPage,
});

function TreatmentIndexPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data } = useQuery(treatments.listOptions(LIST_PARAMS));

  const all = data?.data ?? [];
  const term = search.q.trim().toLowerCase();
  const visible = term
    ? all.filter((treatment) => treatment.name.toLowerCase().includes(term))
    : all;

  // Falling back to the first row means the right pane is never blank on a
  // fresh load, and the URL still wins when it names a treatment.
  const selected =
    all.find((treatment) => treatment.id === search.selected) ?? visible[0];

  return (
    <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[300px_1fr]">
      <Blueprint className="flex min-h-0 flex-col p-3">
        <div className="mb-2 flex items-baseline">
          <Kicker>Treatments</Kicker>
          <span className="text-ink-600 ml-auto text-xs">{all.length}</span>
        </div>
        <Input
          className="mb-2.5 h-9"
          placeholder="Search"
          value={search.q}
          onChange={(event) =>
            navigate({ search: (prev) => ({ ...prev, q: event.target.value }) })
          }
        />
        <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-auto">
          {visible.map((treatment) => {
            const isSelected = treatment.id === selected?.id;
            return (
              <button
                key={treatment.id}
                type="button"
                onClick={() =>
                  navigate({
                    search: (prev) => ({ ...prev, selected: treatment.id }),
                  })
                }
                className={`flex items-center gap-2 px-2.5 py-1.5 text-left text-sm ${
                  isSelected
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <span className="min-w-0 flex-1 truncate">
                  {treatment.name}
                </span>
                <span
                  className={`text-[11.5px] tabular-nums ${isSelected ? '' : 'opacity-60'}`}
                >
                  {amount(treatment.grossPrice)}
                </span>
              </button>
            );
          })}
          {visible.length === 0 ? (
            <p className="text-ink-600 m-0 px-2.5 py-2 text-xs">
              No treatment matches that search.
            </p>
          ) : null}
        </div>
      </Blueprint>

      {selected ? (
        <TreatmentEditor key={selected.id} treatment={selected} />
      ) : (
        <Blueprint className="grid place-items-center p-6">
          <p className="text-ink-600 m-0 text-sm">
            No treatments in the catalog yet.
          </p>
        </Blueprint>
      )}
    </div>
  );
}

type RecipeLine = { productId: string; qty: number };

function TreatmentEditor({ treatment }: { treatment: TreatmentListItem }) {
  const update = treatments.useUpdate();
  const saveRecipe = useSaveTreatmentRecipe(treatment.id);
  const { data: productPage } = useQuery(products.listOptions(PRODUCT_PARAMS));
  const catalog = productPage?.data ?? [];

  const [basePrice, setBasePrice] = useState(String(treatment.basePrice));
  const [grossPrice, setGrossPrice] = useState(String(treatment.grossPrice));
  const [description, setDescription] = useState(treatment.description ?? '');
  const [lines, setLines] = useState<RecipeLine[]>(() =>
    treatment.treatmentProductAssocs.map((line) => ({
      productId: line.productId,
      qty: line.qty,
    })),
  );

  // A save returns the re-read treatment; reset the draft to it so the form
  // shows what was actually stored rather than what was typed.
  useEffect(() => {
    setBasePrice(String(treatment.basePrice));
    setGrossPrice(String(treatment.grossPrice));
    setDescription(treatment.description ?? '');
    setLines(
      treatment.treatmentProductAssocs.map((line) => ({
        productId: line.productId,
        qty: line.qty,
      })),
    );
  }, [treatment]);

  const productById = new Map(catalog.map((product) => [product.id, product]));
  const priceOf = (productId: string) =>
    Number(
      productById.get(productId)?.grossPrice ??
        treatment.treatmentProductAssocs.find(
          (line) => line.productId === productId,
        )?.product.grossPrice ??
        0,
    );

  const recipeCost = lines.reduce(
    (sum, line) => sum + priceOf(line.productId) * line.qty,
    0,
  );
  const margin = Number(grossPrice || 0) - recipeCost;

  const isPending = update.isPending || saveRecipe.isPending;

  function handleSave() {
    update.mutate({
      id: treatment.id,
      input: {
        basePrice: Number(basePrice),
        grossPrice: Number(grossPrice),
        description: description || null,
      },
    });
    saveRecipe.mutate({ lines });
  }

  function addLine() {
    const unused = catalog.find(
      (product) => !lines.some((line) => line.productId === product.id),
    );
    if (unused) setLines((prev) => [...prev, { productId: unused.id, qty: 1 }]);
  }

  const categoryLabel =
    treatment.treatmentCategory.type === 'MEDIC' ? 'medical' : 'non-medical';

  return (
    <div className="flex min-h-0 flex-col gap-3.5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="kicker-accent">
            Treatment · {categoryLabel} ·{' '}
            {treatment.isActive ? 'active' : 'inactive'}
          </div>
          <h3 className="mt-0.5 text-[25px]">{treatment.name}</h3>
        </div>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? 'Saving…' : 'Save treatment'}
        </Button>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-3">
        <Field label="Base price">
          <Input
            className="h-9"
            inputMode="decimal"
            value={basePrice}
            onChange={(event) => setBasePrice(event.target.value)}
          />
        </Field>
        <Field label="Gross price">
          <Input
            className="h-9"
            inputMode="decimal"
            value={grossPrice}
            onChange={(event) => setGrossPrice(event.target.value)}
          />
        </Field>
        <Field label="Tax">
          <Input
            className="h-9"
            readOnly
            value={
              treatment.tax
                ? `${treatment.tax.name} ${treatment.tax.rate}%`
                : '—'
            }
          />
        </Field>
        <Field label="Description" className="sm:col-span-3">
          <Input
            className="h-9"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
      </div>

      <Blueprint className="flex min-h-0 flex-1 flex-col p-3">
        <div className="mb-1 flex items-baseline gap-2">
          <Kicker>Default products</Kicker>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-xs"
            onClick={addLine}
          >
            <Plus />
            Add product
          </Button>
        </div>
        <p className="text-ink-600 mb-2 text-[11.5px]">
          Suggested to the vet whenever this treatment is chosen. Quantities can
          be overridden per patient.
        </p>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="table text-[12.5px]">
            <thead>
              <tr>
                <th>Product</th>
                <th>Dispensing unit</th>
                <th className="text-right">Default qty</th>
                <th className="text-right">Cost</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => {
                const product = productById.get(line.productId);
                return (
                  <tr key={`${line.productId}-${index}`}>
                    <td>
                      <Select
                        value={line.productId}
                        onValueChange={(productId) =>
                          setLines((prev) =>
                            prev.map((item, i) =>
                              i === index ? { ...item, productId } : item,
                            ),
                          )
                        }
                      >
                        <SelectTrigger className="h-8 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {catalog.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td>{product?.dispensingUnit ?? '—'}</td>
                    <td className="text-right">
                      <Input
                        className="ml-auto h-8 w-16 text-right tabular-nums"
                        inputMode="numeric"
                        value={line.qty}
                        onChange={(event) =>
                          setLines((prev) =>
                            prev.map((item, i) =>
                              i === index
                                ? {
                                    ...item,
                                    qty: Math.max(
                                      1,
                                      Number(event.target.value) || 1,
                                    ),
                                  }
                                : item,
                            ),
                          )
                        }
                      />
                    </td>
                    <td className="text-right tabular-nums">
                      {amount(priceOf(line.productId) * line.qty)}
                    </td>
                    <td>
                      <button
                        type="button"
                        aria-label="Remove product"
                        className="opacity-40 hover:opacity-100"
                        onClick={() =>
                          setLines((prev) => prev.filter((_, i) => i !== index))
                        }
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-ink-600 h-16 text-center">
                    No default products. The vet starts from an empty list.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="text-ink-600 mt-auto pt-2 text-[11.5px]">
          Recipe cost {rupiah(recipeCost)} · margin {rupiah(margin)} on gross
          price
        </div>
      </Blueprint>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="text-ink-700 mb-1.5 block text-xs">{label}</span>
      {children}
    </label>
  );
}
