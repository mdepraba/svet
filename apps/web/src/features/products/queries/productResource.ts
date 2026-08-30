import {
  type CreateProduct,
  type ProductListItem,
  ProductListItemSchema,
  type ProductListItemsResponse,
  ProductListItemsResponseSchema,
  type ProductResponse,
  ProductResponseSchema,
  type UpdateProduct,
} from '@svet-monorepo/schemas';

import { createResource, type ListParams } from '@/lib/resource';

export type ProductListParams = ListParams & { type?: 'MEDIC' | 'NON_MEDIC' };

export const products = createResource<
  ProductResponse,
  ProductListItemsResponse,
  CreateProduct,
  UpdateProduct,
  ProductListItem
>({
  key: 'products',
  path: '/product',
  itemSchema: ProductResponseSchema,
  listSchema: ProductListItemsResponseSchema,
  detailSchema: ProductListItemSchema,
});
