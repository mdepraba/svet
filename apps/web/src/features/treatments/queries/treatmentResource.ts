import {
  type CreateTreatment,
  type TreatmentListItem,
  TreatmentListItemSchema,
  type TreatmentListItemsResponse,
  TreatmentListItemsResponseSchema,
  type TreatmentResponse,
  TreatmentResponseSchema,
  type SaveTreatmentRecipe,
  type UpdateTreatment,
} from '@svet-monorepo/schemas';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api';
import { createResource } from '@/lib/resource';

export const treatments = createResource<
  TreatmentResponse,
  TreatmentListItemsResponse,
  CreateTreatment,
  UpdateTreatment,
  TreatmentListItem
>({
  key: 'treatments',
  path: '/treatment',
  itemSchema: TreatmentResponseSchema,
  listSchema: TreatmentListItemsResponseSchema,
  detailSchema: TreatmentListItemSchema,
});

/**
 * Replaces a treatment's default product recipe. The editor holds the whole
 * set, so this sends the whole set — see `SaveTreatmentRecipeSchema`.
 */
export function useSaveTreatmentRecipe(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveTreatmentRecipe) => {
      const response = await apiFetch<unknown>(`/treatment/${id}/recipe`, {
        method: 'PATCH',
        body: input,
      });
      return TreatmentListItemSchema.parse(response);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(treatments.keys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: treatments.keys.all });
    },
  });
}
