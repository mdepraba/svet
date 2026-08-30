import type { ColumnDef } from '@tanstack/react-table';
import type { ProductListItem } from '@svet-monorepo/schemas';

import { Tag } from '@/components/industry/Tag';
import { amount } from '@/lib/format';

/**
 * Below this many units a stock figure is called out in the accent colour.
 * The clinic-wide reorder point lives in settings; this is the table's own
 * "worth a second look" line, applied uniformly.
 */
const LOW_STOCK = 5;

export const productColumns: ColumnDef<ProductListItem>[] = [
  {
    accessorKey: 'sku',
    header: 'SKU',
    cell: ({ row }) => <span className="tabular-nums">{row.original.sku}</span>,
  },
  { accessorKey: 'name', header: 'Name' },
  {
    id: 'category',
    header: 'Category',
    cell: ({ row }) => {
      const isMedical = row.original.productCategory.type === 'MEDIC';
      return (
        <Tag tone={isMedical ? 'accent' : 'neutral'} className="text-[9px]">
          {isMedical ? 'MEDICAL' : 'NON-MEDICAL'}
        </Tag>
      );
    },
  },
  {
    id: 'units',
    header: 'Purchase → dispensing',
    cell: ({ row }) => (
      <>
        {row.original.purchaseUnit} → {row.original.dispensingUnit}{' '}
        <span className="opacity-50">(×{row.original.conversionFactor})</span>
      </>
    ),
  },
  {
    accessorKey: 'grossPrice',
    header: 'Gross price',
    meta: { align: 'right' },
    cell: ({ row }) => (
      <span className="tabular-nums">{amount(row.original.grossPrice)}</span>
    ),
  },
  {
    id: 'tax',
    header: 'Tax',
    meta: { align: 'right' },
    cell: ({ row }) =>
      row.original.tax ? (
        `${row.original.tax.rate}%`
      ) : (
        <span className="text-ink-400">—</span>
      ),
  },
  {
    id: 'stock',
    header: 'Stock',
    meta: { align: 'right' },
    cell: ({ row }) => {
      const stock = row.original.stock;
      if (stock === null) return <span className="text-ink-400">—</span>;
      return (
        <span
          className={`tabular-nums ${stock <= LOW_STOCK ? 'text-brand-800' : ''}`}
        >
          {stock}
        </span>
      );
    },
  },
];
