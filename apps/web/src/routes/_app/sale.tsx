import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Blueprint, Kicker } from '@/components/industry/Blueprint';
import { Tag } from '@/components/industry/Tag';
import { SearchInput } from '@/components/industry/Toolbar';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { invoices } from '@/features/invoices/queries/invoiceResource';
import { owners } from '@/features/owners/queries/ownerResource';
import { products } from '@/features/products/queries/productResource';
import { useRecordMovement } from '@/features/inventory/queries/inventoryResource';
import { amount, rupiah } from '@/lib/format';
import type { ProductListItem } from '@svet-monorepo/schemas';

const OWNER_PARAMS = { limit: 100, sortBy: 'name', sortOrder: 'asc' } as const;

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'QRIS', label: 'QRIS' },
  { value: 'TRANSFER', label: 'Bank transfer' },
] as const;

const searchSchema = z.object({ q: z.string().default('').catch('') });

type CartLine = { product: ProductListItem; qty: number };

export const Route = createFileRoute('/_app/sale')({
  staticData: { breadcrumbTitle: 'New sale' },
  validateSearch: searchSchema,
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      products.ensureList(queryClient, {
        limit: 50,
        sortBy: 'name',
        sortOrder: 'asc',
      }),
      owners.ensureList(queryClient, OWNER_PARAMS),
    ]),
  component: SalePage,
});

function SalePage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const { data: productPage } = useQuery(
    products.listOptions({
      limit: 50,
      search: search.q || undefined,
      sortBy: 'name',
      sortOrder: 'asc',
    }),
  );
  const { data: ownerPage } = useQuery(owners.listOptions(OWNER_PARAMS));

  const createInvoice = invoices.useCreate();
  const recordMovement = useRecordMovement();

  const [cart, setCart] = useState<CartLine[]>([]);
  const [ownerId, setOwnerId] = useState('');
  const [paymentMethod, setPaymentMethod] =
    useState<(typeof PAYMENT_METHODS)[number]['value']>('CASH');

  function addToCart(product: ProductListItem) {
    setCart((prev) => {
      const existing = prev.find((line) => line.product.id === product.id);
      if (existing) {
        return prev.map((line) =>
          line.product.id === product.id
            ? { ...line, qty: line.qty + 1 }
            : line,
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  }

  function setQty(productId: string, qty: number) {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((line) => line.product.id !== productId)
        : prev.map((line) =>
            line.product.id === productId ? { ...line, qty } : line,
          ),
    );
  }

  const subtotal = cart.reduce(
    (sum, line) => sum + Number(line.product.basePrice) * line.qty,
    0,
  );
  const gross = cart.reduce(
    (sum, line) => sum + Number(line.product.grossPrice) * line.qty,
    0,
  );
  const tax = gross - subtotal;

  const isBusy = createInvoice.isPending || recordMovement.isPending;

  async function takePayment() {
    if (cart.length === 0) {
      toast.error('The cart is empty');
      return;
    }

    try {
      // An owner is optional here: a walk-in buying products over the counter
      // has no visit and need not be on file.
      const invoice = await createInvoice.mutateAsync({
        ownerId: ownerId || null,
        visitId: null,
        paymentMethod,
        status: 'PAID',
        details: cart.map((line) => ({
          productId: line.product.id,
          quantity: line.qty,
          unitPrice: Number(line.product.grossPrice),
          notes: null,
        })),
      });

      // Retail still moves stock — the ledger row points at the invoice that
      // caused it, exactly as a visit's medical use does.
      for (const line of cart) {
        await recordMovement.mutateAsync({
          productId: line.product.id,
          movementType: 'SALE_OUT',
          movementRef: invoice.identifier,
          changeQty: -line.qty,
          costUnitPrice: null,
          notes: 'Walk-in retail',
        });
      }

      toast.success(`Invoice ${invoice.identifier} issued`);
      navigate({ to: '/invoice/$id', params: { id: invoice.id } });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not take payment',
      );
    }
  }

  return (
    <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[1fr_300px]">
      <div className="flex min-h-0 flex-col gap-3.5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="kicker-accent">Retail · no visit attached</div>
            <h3 className="mt-0.5 text-[25px]">New sale</h3>
          </div>
          <Select value={ownerId} onValueChange={setOwnerId}>
            <SelectTrigger className="h-9 w-56">
              <SelectValue placeholder="Attach an owner (optional)" />
            </SelectTrigger>
            <SelectContent>
              {(ownerPage?.data ?? []).map((owner) => (
                <SelectItem key={owner.id} value={owner.id}>
                  {owner.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <SearchInput
          className="w-full max-w-md"
          placeholder="Scan or search: SKU, product name"
          value={search.q}
          onChange={(event) =>
            navigate({ search: () => ({ q: event.target.value }) })
          }
        />

        <Blueprint className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="table text-[12.5px]">
              <thead>
                <tr>
                  <th className="pl-3">SKU</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th className="text-right">Price</th>
                  <th className="pr-3 text-right">Stock</th>
                </tr>
              </thead>
              <tbody>
                {(productPage?.data ?? []).map((product) => {
                  const isMedical = product.productCategory.type === 'MEDIC';
                  return (
                    <tr
                      key={product.id}
                      className="cursor-pointer"
                      onClick={() => addToCart(product)}
                    >
                      <td className="pl-3 tabular-nums">{product.sku}</td>
                      <td>{product.name}</td>
                      <td>
                        <Tag
                          tone={isMedical ? 'accent' : 'neutral'}
                          className="text-[9px]"
                        >
                          {isMedical ? 'MEDICAL' : 'NON-MEDICAL'}
                        </Tag>
                      </td>
                      <td className="text-right tabular-nums">
                        {amount(product.grossPrice)}
                      </td>
                      <td className="pr-3 text-right tabular-nums">
                        {product.stock ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-border flex items-center gap-2 border-t px-3 py-2">
            <TriangleAlert className="text-brand-800 size-3.5 flex-none" />
            <span className="text-ink-600 text-[11.5px]">
              Medical products sold over the counter still leave the stock
              ledger, but they carry no medical record.
            </span>
          </div>
        </Blueprint>
      </div>

      <div className="flex min-h-0 flex-col gap-3">
        <Blueprint className="flex min-h-0 flex-col px-3 py-2.5">
          <div className="mb-2 flex items-baseline">
            <Kicker>Cart</Kicker>
            <span className="text-ink-600 ml-auto text-xs">
              {cart.length} {cart.length === 1 ? 'line' : 'lines'}
            </span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
            {cart.length === 0 ? (
              <p className="text-ink-600 m-0 text-[12.5px]">
                Click a product to add it.
              </p>
            ) : (
              cart.map((line) => (
                <div key={line.product.id} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px]">
                      {line.product.name}
                    </div>
                    <div className="text-ink-600 text-[11px]">
                      {rupiah(line.product.grossPrice)} ·{' '}
                      {line.product.dispensingUnit}
                    </div>
                  </div>
                  <div className="border-border flex items-center border">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      className="px-2 py-0.5 text-[13px] opacity-60"
                      onClick={() => setQty(line.product.id, line.qty - 1)}
                    >
                      −
                    </button>
                    <span className="border-border border-x px-2.5 py-0.5 text-[13px] tabular-nums">
                      {line.qty}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      className="px-2 py-0.5 text-[13px] opacity-60"
                      onClick={() => setQty(line.product.id, line.qty + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-border mt-2.5 border-t pt-2">
            <Row label="Subtotal" value={rupiah(subtotal)} />
            <Row label="Tax" value={rupiah(tax)} />
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-heading text-base">Total</span>
              <span className="font-heading text-lg tabular-nums">
                {rupiah(gross)}
              </span>
            </div>
          </div>
        </Blueprint>

        <Blueprint className="px-3 py-2.5">
          <Kicker className="mb-2">Payment</Kicker>
          <div className="flex flex-col gap-1.5">
            {PAYMENT_METHODS.map((method) => (
              <label key={method.value} className="radio">
                <input
                  type="radio"
                  name="sale-payment"
                  checked={paymentMethod === method.value}
                  onChange={() => setPaymentMethod(method.value)}
                />
                <span className="dot" />
                {method.label}
              </label>
            ))}
          </div>
        </Blueprint>

        <Button
          className="mt-auto w-full"
          disabled={isBusy || cart.length === 0}
          onClick={takePayment}
        >
          {isBusy ? 'Taking payment…' : 'Take payment'}
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-1 flex justify-between text-[13px]">
      <span className="text-ink-600">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
