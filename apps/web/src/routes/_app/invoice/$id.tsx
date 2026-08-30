import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

import { Blueprint, Kicker } from '@/components/industry/Blueprint';
import { InvoiceStatusTag, Tag } from '@/components/industry/Tag';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { invoices } from '@/features/invoices/queries/invoiceResource';
import { amount, dateTime, rupiah } from '@/lib/format';
import type { InvoiceResponse } from '@svet-monorepo/schemas';

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'QRIS', label: 'QRIS' },
  { value: 'TRANSFER', label: 'Bank transfer' },
] as const;

export const Route = createFileRoute('/_app/invoice/$id')({
  staticData: { breadcrumbTitle: 'Invoice' },
  loader: ({ context: { queryClient }, params }) =>
    invoices.ensureDetail(queryClient, params.id),
  component: InvoiceDetailPage,
});

function InvoiceDetailPage() {
  const { id } = Route.useParams();
  const { data: invoice } = useQuery(invoices.detailOptions(id));

  if (!invoice) return null;
  return <InvoiceDetail key={invoice.id} invoice={invoice} />;
}

function InvoiceDetail({ invoice }: { invoice: InvoiceResponse }) {
  const update = invoices.useUpdate();
  const [paymentMethod, setPaymentMethod] = useState(invoice.paymentMethod);
  const [discount, setDiscount] = useState(String(invoice.totalDiscount));

  const isSettled = invoice.status !== 'PENDING';

  // `totalGross` is stored net of discount; the subtotal line has to add it
  // back so the three rows read as arithmetic the owner can follow.
  const subtotal =
    invoice.totalGross + invoice.totalDiscount - invoice.totalTax;
  const totalDue = invoice.totalGross;

  function save(next: Partial<{ status: 'PAID' | 'CANCELLED' }>) {
    update.mutate(
      {
        id: invoice.id,
        input: {
          paymentMethod,
          totalDiscount: Number(discount) || 0,
          ...next,
        },
      },
      {
        onSuccess: () =>
          toast.success(
            next.status === 'PAID'
              ? 'Invoice marked as paid'
              : next.status === 'CANCELLED'
                ? 'Invoice cancelled'
                : 'Invoice updated',
          ),
        onError: (error) =>
          toast.error(
            error instanceof Error
              ? error.message
              : 'Could not update the invoice',
          ),
      },
    );
  }

  return (
    <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[1fr_300px]">
      <div className="flex min-h-0 flex-col gap-3.5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="kicker-accent">
              {invoice.visitId ? (
                <Link to="/visit/$id" params={{ id: invoice.visitId }}>
                  From a visit
                </Link>
              ) : (
                'Walk-in retail'
              )}
            </div>
            <h3 className="mt-0.5 text-[25px]">{invoice.identifier}</h3>
            <div className="text-ink-600 text-[12.5px]">
              {invoice.owner ? (
                <Link to="/owner/$id" params={{ id: invoice.owner.id }}>
                  {invoice.owner.name}
                </Link>
              ) : (
                'No owner attached'
              )}{' '}
              · issued {dateTime(invoice.createdAt)}
              {invoice.paidAt ? ` · paid ${dateTime(invoice.paidAt)}` : ''}
            </div>
          </div>
          <InvoiceStatusTag status={invoice.status} className="text-[11px]" />
        </div>

        <Blueprint className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="table text-[12.5px]">
              <thead>
                <tr>
                  <th className="pl-3">Line</th>
                  <th>Kind</th>
                  <th>For</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Unit price</th>
                  <th className="pr-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {invoice.invoiceDetails.map((line) => {
                  const isTreatment = Boolean(line.treatmentId);
                  return (
                    <tr key={line.id}>
                      <td className="pl-3">
                        {line.treatment?.name ?? line.product?.name ?? '—'}
                      </td>
                      <td>
                        <Tag
                          tone={isTreatment ? 'outline' : 'neutral'}
                          className="text-[9px]"
                        >
                          {isTreatment ? 'TREATMENT' : 'PRODUCT'}
                        </Tag>
                      </td>
                      <td>
                        {line.notes ?? (
                          <span className="text-ink-500">Retail</span>
                        )}
                      </td>
                      <td className="text-right tabular-nums">
                        {line.quantity}
                      </td>
                      <td className="text-right tabular-nums">
                        {amount(line.unitPrice)}
                      </td>
                      <td className="pr-3 text-right tabular-nums">
                        {amount(line.subtotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-border flex items-center gap-2 border-t px-3 py-2">
            <span className="text-ink-500 ml-auto text-[11.5px]">
              Prices locked at {dateTime(invoice.createdAt)} — later catalog
              changes will not touch this invoice
            </span>
          </div>
        </Blueprint>
      </div>

      <div className="flex min-h-0 flex-col gap-3.5">
        <Blueprint className="px-3 py-2.5">
          <Kicker className="mb-2">Totals</Kicker>
          <TotalRow label="Subtotal" value={rupiah(subtotal)} />
          <TotalRow label="Tax" value={rupiah(invoice.totalTax)} />
          <TotalRow
            label="Discount"
            value={`− ${rupiah(invoice.totalDiscount)}`}
          />
          <div className="border-border mt-2 flex items-baseline justify-between border-t pt-2">
            <span className="font-heading text-base">Total due</span>
            <span className="font-heading text-[22px] tabular-nums">
              {rupiah(totalDue)}
            </span>
          </div>
        </Blueprint>

        <Blueprint className="px-3 py-2.5">
          <Kicker className="mb-2">Payment method</Kicker>
          <div className="flex flex-col gap-1.5">
            {PAYMENT_METHODS.map((method) => (
              <label key={method.value} className="radio">
                <input
                  type="radio"
                  name="payment-method"
                  checked={paymentMethod === method.value}
                  disabled={isSettled}
                  onChange={() => setPaymentMethod(method.value)}
                />
                <span className="dot" />
                {method.label}
              </label>
            ))}
          </div>

          <label className="mt-2.5 block">
            <span className="text-ink-700 mb-1.5 block text-xs">Discount</span>
            <Input
              className="h-9 tabular-nums"
              inputMode="decimal"
              disabled={isSettled}
              value={discount}
              onChange={(event) => setDiscount(event.target.value)}
            />
          </label>
        </Blueprint>

        <div className="mt-auto flex flex-col gap-2">
          {isSettled ? (
            <p className="text-ink-600 m-0 text-[11.5px]">
              This invoice is {invoice.status.toLowerCase()} and can no longer
              be edited.
            </p>
          ) : (
            <>
              <Button
                className="w-full"
                disabled={update.isPending}
                onClick={() => save({ status: 'PAID' })}
              >
                Mark as paid
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => save({})}
                  disabled={update.isPending}
                >
                  Save changes
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => save({ status: 'CANCELLED' })}
                  disabled={update.isPending}
                >
                  Cancel invoice
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-1 flex justify-between text-[13px]">
      <span className="text-ink-600">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
