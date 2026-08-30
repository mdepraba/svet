# User Stories — Treatment Catalog

Covers the clinical services the clinic offers, and the standard products each service typically
consumes.

## Treatment Categories

- As an **Admin**, I want to create treatment categories (e.g. Consultation, Vaccination,
  Grooming, Surgery) and mark each as Medical or Non-Medical, so services can be grouped and
  reported correctly.
- As an **Admin**, I want to rename or update a treatment category as the service list evolves.
- As an **Admin**, I want to archive a treatment category no longer offered, without breaking
  historical treatments assigned to it.

## Treatments

- As an **Admin**, I want to add a new treatment with its name, description, category, and
  pricing (base price, tax, resulting price), so it can be offered and billed consistently.
- As an **Admin**, I want to set a maximum discount allowed on a treatment, so it can't be
  discounted beyond clinic policy.
- As **front-desk staff or a Vet**, I want to search the treatment list by name, so I can quickly
  select the right service during a visit.
- As an **Admin**, I want to mark a treatment inactive (e.g. temporarily unavailable), without
  losing its history in past visits and invoices.
- As an **Admin**, I want to reactivate a treatment once it's available again.
- As an **Admin**, I want to archive or permanently remove a treatment added by mistake.

## Treatment's Default Products

- As an **Admin**, I want to attach a standard set of products (and quantities) to a treatment
  (e.g. "Rabies Vaccination" normally uses one vial of rabies vaccine), so vets have a sensible
  starting point during a visit instead of picking products from scratch every time.
- As an **Admin**, I want to update the quantity or product in a treatment's default list as
  clinical practice or supplier products change.
- As an **Admin**, I want to remove a product from a treatment's default list if it's no longer
  used for that service.
