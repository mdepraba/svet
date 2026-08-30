import {
  type CreateOwner,
  type OwnerDetail,
  OwnerDetailSchema,
  type OwnerListItemsResponse,
  OwnerListItemsResponseSchema,
  type OwnerResponse,
  OwnerResponseSchema,
  type UpdateOwner,
} from '@svet-monorepo/schemas';

import { createResource } from '@/lib/resource';

export const owners = createResource<
  OwnerResponse,
  OwnerListItemsResponse,
  CreateOwner,
  UpdateOwner,
  OwnerDetail
>({
  key: 'owners',
  path: '/owner',
  itemSchema: OwnerResponseSchema,
  listSchema: OwnerListItemsResponseSchema,
  detailSchema: OwnerDetailSchema,
});
