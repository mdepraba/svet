import {
  type CreateProductCategory,
  type CreateTax,
  type CreateTreatmentCategory,
  type CreateUnit,
  type ProductCategoryListResponse,
  ProductCategoryListResponseSchema,
  type ProductCategoryResponse,
  ProductCategoryResponseSchema,
  type TaxListResponse,
  TaxListResponseSchema,
  type TaxResponse,
  TaxResponseSchema,
  type TreatmentCategoryListResponse,
  TreatmentCategoryListResponseSchema,
  type TreatmentCategoryResponse,
  TreatmentCategoryResponseSchema,
  type UnitListResponse,
  UnitListResponseSchema,
  type UnitResponse,
  UnitResponseSchema,
  type UpdateProductCategory,
  type UpdateTax,
  type UpdateTreatmentCategory,
  type UpdateUnit,
} from '@svet-monorepo/schemas';

import { createResource } from '@/lib/resource';

/** The reference tables the product and treatment forms select from. */

export const productCategories = createResource<
  ProductCategoryResponse,
  ProductCategoryListResponse,
  CreateProductCategory,
  UpdateProductCategory
>({
  key: 'product-categories',
  path: '/product/category',
  itemSchema: ProductCategoryResponseSchema,
  listSchema: ProductCategoryListResponseSchema,
});

export const treatmentCategories = createResource<
  TreatmentCategoryResponse,
  TreatmentCategoryListResponse,
  CreateTreatmentCategory,
  UpdateTreatmentCategory
>({
  key: 'treatment-categories',
  path: '/treatment/category',
  itemSchema: TreatmentCategoryResponseSchema,
  listSchema: TreatmentCategoryListResponseSchema,
});

export const taxes = createResource<
  TaxResponse,
  TaxListResponse,
  CreateTax,
  UpdateTax
>({
  key: 'taxes',
  path: '/tax',
  itemSchema: TaxResponseSchema,
  listSchema: TaxListResponseSchema,
});

export const units = createResource<
  UnitResponse,
  UnitListResponse,
  CreateUnit,
  UpdateUnit
>({
  key: 'units',
  path: '/unit',
  itemSchema: UnitResponseSchema,
  listSchema: UnitListResponseSchema,
});
