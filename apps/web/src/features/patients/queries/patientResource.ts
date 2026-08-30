import {
  type CreatePatient,
  type PatientListItem,
  PatientListItemSchema,
  type PatientListItemsResponse,
  PatientListItemsResponseSchema,
  type PatientResponse,
  PatientResponseSchema,
  type UpdatePatient,
} from '@svet-monorepo/schemas';

import { createResource, type ListParams } from '@/lib/resource';

export type PatientListParams = ListParams & { species?: string };

export const patients = createResource<
  PatientResponse,
  PatientListItemsResponse,
  CreatePatient,
  UpdatePatient,
  PatientListItem
>({
  key: 'patients',
  path: '/patient',
  itemSchema: PatientResponseSchema,
  listSchema: PatientListItemsResponseSchema,
  detailSchema: PatientListItemSchema,
});
