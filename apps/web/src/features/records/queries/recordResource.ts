import {
  type MedicalRecordListItem,
  MedicalRecordListItemSchema,
  type MedicalRecordListItemsResponse,
  MedicalRecordListItemsResponseSchema,
  type CreateMedicalRecord,
  type CreateMedicalUsage,
  type MedicalRecordResponse,
  MedicalRecordResponseSchema,
  type MedicalUsageListResponse,
  MedicalUsageListResponseSchema,
  type MedicalUsageResponse,
  MedicalUsageResponseSchema,
  type UpdateMedicalRecord,
  type UpdateMedicalUsage,
} from '@svet-monorepo/schemas';

import { createResource } from '@/lib/resource';

export const medicalRecords = createResource<
  MedicalRecordResponse,
  MedicalRecordListItemsResponse,
  CreateMedicalRecord,
  UpdateMedicalRecord,
  MedicalRecordListItem
>({
  key: 'medical-records',
  path: '/medical-record',
  itemSchema: MedicalRecordResponseSchema,
  listSchema: MedicalRecordListItemsResponseSchema,
  detailSchema: MedicalRecordListItemSchema,
});

export const medicalUsages = createResource<
  MedicalUsageResponse,
  MedicalUsageListResponse,
  CreateMedicalUsage,
  UpdateMedicalUsage
>({
  key: 'medical-usages',
  path: '/medical-record/usage',
  itemSchema: MedicalUsageResponseSchema,
  listSchema: MedicalUsageListResponseSchema,
});
