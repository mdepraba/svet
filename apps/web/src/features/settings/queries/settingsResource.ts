import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  type ClinicSettings,
  ClinicSettingsSchema,
  type UpdateClinicSettings,
} from '@svet-monorepo/schemas';

import { apiFetch } from '@/lib/api';

export const settingsKeys = { all: ['settings'] as const };

export async function getSettings(): Promise<ClinicSettings> {
  const response = await apiFetch<ClinicSettings>('/setting');
  return ClinicSettingsSchema.parse(response);
}

export const settingsOptions = () => ({
  queryKey: settingsKeys.all,
  queryFn: getSettings,
});

export function useSettings() {
  return useQuery(settingsOptions());
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateClinicSettings) => {
      const response = await apiFetch<ClinicSettings>('/setting', {
        method: 'PATCH',
        body: input,
      });
      return ClinicSettingsSchema.parse(response);
    },
    onSuccess: (data) => queryClient.setQueryData(settingsKeys.all, data),
  });
}
