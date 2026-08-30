# User Stories — Product Catalog & Inventory Setup

Covers the products the clinic sells or uses, and the reference data (categories, units, tax)
that pricing and stock depend on.

## Product Categories

- As an **Admin**, I want to create product categories (e.g. Medicine, Food, Accessories) and
  mark each as Medical or Non-Medical, so products can be grouped and reported on correctly.
- As an **Admin**, I want to rename or update a category's description, so the catalog stays
  organized as the business grows.
- As an **Admin**, I want to archive a category that's no longer used, without breaking the
  products historically assigned to it.

## Units

- As an **Admin**, I want to define measurement units (box, vial, ml, tablet), so products can be
  bought and sold using the right unit.
- As an **Admin**, I want to update a unit's name if it was entered incorrectly.

## Tax

- As an **Admin**, I want to configure a tax rate (including a 0% rate for tax-exempt items), so
  it can be applied consistently to products and treatments.
- As an **Admin**, I want to update a tax rate when regulations or clinic policy change.

## Products

- As an **Admin**, I want to add a new product with its SKU, name, category, purchase unit,
  selling unit, and the conversion between them (e.g. one box = 100 tablets), so it can be
  tracked and sold correctly.
- As an **Admin**, I want to set a product's base price, tax, and the resulting price the
  customer pays, so billing is consistent every time it's sold.
- As an **Admin**, I want to set a maximum discount allowed on a product, so front-desk staff
  can't discount it beyond what the business allows.
- As **front-desk staff**, I want to search the product catalog by name or SKU, so I can quickly
  find what a customer is asking for.
- As an **Admin**, I want to mark a product inactive (e.g. discontinued) without deleting its
  history, so it stops showing up for new sales but past invoices remain intact.
- As an **Admin**, I want to reactivate a product if it comes back into stock/production.
- As an **Admin**, I want to archive or permanently remove a product that was added by mistake.
