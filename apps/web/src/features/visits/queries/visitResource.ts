import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  type CreateVisitInput,
  type CreateVisitDetail,
  VisitDetailResponseSchema,
  type SaveWorksheet,
  type VisitListItemsResponse,
  VisitListItemsResponseSchema,
  type VisitListItem,
  VisitListItemSchema,
  type VisitResponse,
  VisitResponseSchema,
  type VisitWorksheet,
  VisitWorksheetSchema,
} from '@svet-monorepo/schemas';
import { z } from 'zod';

import { apiFetch } from '@/lib/api';
import { listQueryString, type ListParams } from '@/lib/resource';

export type VisitListParams = ListParams & {
  status?: 'SCHEDULED' | 'ONGOING' | 'FINISHED' | 'CANCELLED';
  /** `YYYY-MM-DD`. */
  date?: string;
};

export const visitKeys = {
  all: ['visits'] as const,
  list: (params: VisitListParams = {}) => ['visits', 'list', params] as const,
  detail: (id: string) => ['visits', 'detail', id] as const,
  day: (date: string) => ['visits', 'day', date] as const,
};

export async function getVisits(
  params: VisitListParams = {},
): Promise<VisitListItemsResponse> {
  const response = await apiFetch<VisitListItemsResponse>(
    `/visit${listQueryString(params)}`,
  );
  return VisitListItemsResponseSchema.parse(response);
}

export async function getVisitsForDay(date: string): Promise<VisitListItem[]> {
  const response = await apiFetch<VisitListItem[]>(
    `/visit/day?date=${encodeURIComponent(date)}`,
  );
  return z.array(VisitListItemSchema).parse(response);
}

export async function getVisit(id: string): Promise<VisitWorksheet> {
  const response = await apiFetch<VisitWorksheet>(`/visit/${id}`);
  return VisitWorksheetSchema.parse(response);
}

export async function createVisit(
  input: CreateVisitInput,
): Promise<VisitResponse> {
  const response = await apiFetch<VisitResponse>('/visit', {
    method: 'POST',
    body: input,
  });
  return VisitResponseSchema.parse(response);
}

export const visitListOptions = (params: VisitListParams = {}) => ({
  queryKey: visitKeys.list(params),
  queryFn: () => getVisits(params),
});

export const visitDetailOptions = (id: string) => ({
  queryKey: visitKeys.detail(id),
  queryFn: () => getVisit(id),
});

export const visitDayOptions = (date: string) => ({
  queryKey: visitKeys.day(date),
  queryFn: () => getVisitsForDay(date),
});

export function useVisits(params: VisitListParams = {}) {
  return useQuery({
    ...visitListOptions(params),
    placeholderData: keepPreviousData,
  });
}

export function useVisit(id: string) {
  return useQuery({ ...visitDetailOptions(id), enabled: Boolean(id) });
}

export function useVisitsForDay(date: string) {
  return useQuery(visitDayOptions(date));
}

export function useCreateVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVisit,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: visitKeys.all }),
  });
}

/**
 * Save Only — the visit stays ONGOING and nothing is billed. Returns the
 * re-read worksheet so the client picks up the ids the server just minted.
 */
export function useSaveVisitDraft(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveWorksheet) => {
      const response = await apiFetch<VisitWorksheet>(`/visit/${id}/draft`, {
        method: 'PATCH',
        body: input,
      });
      return VisitWorksheetSchema.parse(response);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(visitKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: visitKeys.all });
    },
  });
}

const FinishResponseSchema = z.object({
  visit: VisitWorksheetSchema,
  invoice: z.object({ id: z.uuid(), identifier: z.string() }),
});

/** Save and Make Invoice — closes the visit and hands back the new invoice. */
export function useFinishVisit(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveWorksheet) => {
      const response = await apiFetch<unknown>(`/visit/${id}/finished`, {
        method: 'PATCH',
        body: input,
      });
      return FinishResponseSchema.parse(response);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(visitKeys.detail(id), data.visit);
      queryClient.invalidateQueries({ queryKey: visitKeys.all });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useCancelVisit(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<unknown>(`/visit/${id}/cancel`, { method: 'PATCH' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: visitKeys.all }),
  });
}

/**
 * Attaches one patient (and its attending vet) to a visit. Used at
 * registration, before the visit has a record for the worksheet save to
 * reconcile against.
 */
export function useCreateVisitDetail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateVisitDetail) => {
      const response = await apiFetch<unknown>('/visit/detail', {
        method: 'POST',
        body: input,
      });
      return VisitDetailResponseSchema.parse(response);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: visitKeys.all }),
  });
}
