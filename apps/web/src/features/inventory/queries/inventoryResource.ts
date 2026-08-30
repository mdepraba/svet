import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import {
  type CreateStockMovement,
  type ProductStockResponse,
  ProductStockListSchema,
  type StockMovementListResponse,
  StockMovementListResponseSchema,
  StockMovementResponseSchema,
} from '@svet-monorepo/schemas';

import { apiFetch } from '@/lib/api';
import { listQueryString, type ListParams } from '@/lib/resource';

export const inventoryKeys = {
  all: ['inventory'] as const,
  ledger: (params: ListParams = {}) => ['inventory', 'ledger', params] as const,
  stock: () => ['inventory', 'stock'] as const,
  lowStock: (threshold?: number) =>
    ['inventory', 'low-stock', threshold ?? null] as const,
};

export async function getLedger(
  params: ListParams = {},
): Promise<StockMovementListResponse> {
  const response = await apiFetch<StockMovementListResponse>(
    `/inventory/ledger${listQueryString(params)}`,
  );
  return StockMovementListResponseSchema.parse(response);
}

export async function getStock(): Promise<ProductStockResponse[]> {
  const response = await apiFetch<ProductStockResponse[]>('/inventory/stock');
  return ProductStockListSchema.parse(response);
}

export async function getLowStock(
  threshold?: number,
): Promise<ProductStockResponse[]> {
  const query = threshold === undefined ? '' : `?threshold=${threshold}`;
  const response = await apiFetch<ProductStockResponse[]>(
    `/inventory/low-stock${query}`,
  );
  return ProductStockListSchema.parse(response);
}

export const ledgerOptions = (params: ListParams = {}) => ({
  queryKey: inventoryKeys.ledger(params),
  queryFn: () => getLedger(params),
});

export const stockOptions = () => ({
  queryKey: inventoryKeys.stock(),
  queryFn: () => getStock(),
});

export const lowStockOptions = (threshold?: number) => ({
  queryKey: inventoryKeys.lowStock(threshold),
  queryFn: () => getLowStock(threshold),
});

export function useLedger(params: ListParams = {}) {
  return useQuery({
    ...ledgerOptions(params),
    placeholderData: keepPreviousData,
  });
}

export function useStock() {
  return useQuery(stockOptions());
}

export function useLowStock(threshold?: number) {
  return useQuery(lowStockOptions(threshold));
}

export function useRecordMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateStockMovement) => {
      const response = await apiFetch<unknown>('/inventory/movement', {
        method: 'POST',
        body: input,
      });
      return StockMovementResponseSchema.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
