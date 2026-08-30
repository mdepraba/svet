import { useQuery } from '@tanstack/react-query';
import {
  type DashboardSummary,
  DashboardSummarySchema,
} from '@svet-monorepo/schemas';

import { apiFetch } from '@/lib/api';

export const dashboardKeys = { summary: ['dashboard', 'summary'] as const };

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await apiFetch<DashboardSummary>('/dashboard/summary');
  return DashboardSummarySchema.parse(response);
}

export const dashboardSummaryOptions = () => ({
  queryKey: dashboardKeys.summary,
  queryFn: getDashboardSummary,
});

export function useDashboardSummary() {
  return useQuery(dashboardSummaryOptions());
}
