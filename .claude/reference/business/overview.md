# SVET — Business Reference

This document describes the business SVET exists to run. No technical detail — just what the
business is, who it serves, and how money and care flow through it.

## What SVET Is

SVET is a management system for a small veterinary clinic that also runs a retail counter
(a "pet shop" side selling food, medicine, and accessories). It exists to run two things well,
under one roof:

1. **Patient care** — an accurate, permanent medical history for every pet that comes through
   the door.
2. **Point of sale** — selling products and clinical services, and turning that into a correct
   invoice every time.

Both sides of the business meet at the same counter and the same invoice: a pet's visit can
result in a bill that mixes a consultation fee, a vaccine, and a bag of food bought on the way out.

## Who Uses the System (Staff)

- **Admin** — the clinic owner or manager. Manages staff accounts, pricing, and clinic-wide
  configuration.
- **Veterinarian (Vet)** — sees patients, records medical findings, decides what treatments and
  products a case needs.
- **Front-desk / Cashier Staff** — registers visits, manages owner and pet records, handles
  payment and invoicing.

Every staff member has a **Role** that determines what they're allowed to do in the system.

## Who the Business Serves (not staff, but the people and animals the business is about)

- **Owner** — the paying customer: the person who brings an animal in. One owner can bring in
  several pets over time.
- **Patient** — the animal itself. Every patient belongs to exactly one owner.

## The Business Model

Revenue comes from two channels that both end up on the same invoice:

- **Medical visits** — consultations, vaccinations, treatments, minor procedures.
- **Retail sales** — medicine, food, and accessories sold with or without an accompanying visit
  (a customer can just walk in and buy a bag of food).

## Core Business Areas

1. **Master data / catalog** — the reference information everything else depends on: who the
   owners and patients are, what products and treatments the clinic offers, what units and tax
   rates apply.
2. **Clinical care (EMR)** — registering a visit, assigning a vet to each pet, recording what was
   done and what was found.
3. **Billing (Point of Sale)** — turning a visit — or a walk-in sale — into an invoice and
   collecting payment.
4. **Inventory control** — keeping stock counts accurate as products are bought in, used in
   treatment, sold, or adjusted.
5. **Clinic configuration** — clinic-wide settings that don't belong to any one record (e.g. the
   clinic's name, invoice numbering).

## Domain Glossary

| Term | What it means in the business |
|---|---|
| Owner | The customer — the person responsible for and paying for a pet's care. |
| Patient | A pet belonging to an owner. Has a species, breed, and date of birth. |
| Product | A physical item sold or used in care — medicine, vaccine, food, accessory. |
| Product Category | Groups products as **Medical** or **Non-Medical** (retail), which matters for reporting and how they're treated in the clinic's books. |
| Unit | The unit a product is measured in (box, vial, ml, tablet) — a product can be bought in one unit (e.g. a box) and dispensed/sold in a smaller one (e.g. a tablet), with a conversion between the two. |
| Tax | A configurable tax rate that can be applied to a product or a treatment. |
| Treatment | A clinical service the vet performs — consultation, vaccination, grooming, a procedure. Kept separate from products so pricing for services and goods can evolve independently. |
| Treatment Category | Same Medical / Non-Medical split as products, applied to services. |
| Treatment's default products | A treatment can have a standard "recipe" of products it normally uses (e.g. a rabies vaccination normally uses one vial of rabies vaccine). This is a default the vet can override for an individual pet. |
| Visit | A clinic appointment — an owner bringing in one or more pets on a given date. Classified as Medical or Non-Medical, and tracked through a status: Scheduled → Ongoing → Finished, or Cancelled. |
| Visit Detail | One specific pet's part of a visit, assigned to a specific vet. This is how one visit can cover several pets from the same owner, each possibly seen by a different vet. |
| Chosen treatments & products (within a visit) | For each pet seen, the vet records which treatments were actually performed and which products were actually used — a product used can come from a treatment's default recipe or be added manually by the vet. |
| Medical Record | The clinical write-up for a pet's visit: vital signs (temperature, pulse, respiration, weight), history/complaint, diagnosis, and treatment notes. |
| Medical Usage | The final, locked-in record of exactly which products (and how much of each) were consumed for a medical record. This becomes part of the pet's permanent clinical history once the visit is finished and should never be edited afterward — it protects both the medical record's integrity and the inventory count. |
| Invoice | The bill issued to an owner. Can be tied to a visit (medical + retail combined) or stand entirely on its own for a walk-in retail sale. Tracks the subtotal, tax, discount, total, payment method (Cash, QRIS, Bank Transfer), and status (Pending → Paid, or Cancelled). |
| Invoice line item | One line on the invoice — either a product or a treatment, with the quantity and price **as they were at the moment of sale**. Prices are locked in per invoice so a later price change never rewrites a past bill. |
| Stock count | The current on-hand quantity of a product — the number staff and vets check to know what's available right now. |
| Stock history | The full trail of every stock movement for a product: purchases received, sales, medical use, returns, manual adjustments, and transfers. This is what the current stock count is built from, and it's never edited after the fact — only added to. |
| Setting | A clinic-wide configuration value (e.g. clinic name, invoice number format) that isn't tied to any one owner, patient, or product. |
| Role / Staff account | An internal staff login and the permission level attached to it (e.g. Admin, Vet, Front-desk). |

## Key Business Rules

- **Nothing is truly erased by accident.** Records across the business (owners, patients,
  products, treatments, visits, etc.) can be archived and later restored. Permanent removal is a
  separate, deliberate action.
- **Every record says who touched it.** Records carry who created them and who last changed them,
  for accountability.
- **Prices and quantities on a paid invoice never change**, even if the master price for a
  product or treatment changes later — an invoice is a historical fact.
- **Once a visit's medical usage is recorded, it's final** — it's the audit trail proving what was
  actually used on a specific animal and shouldn't be revised after the fact.
- **A sale doesn't require a visit.** Someone can walk in and buy products without any clinical
  visit taking place.
- **An invoice line is either a product or a treatment**, never neither and never something else.
- **Stock history is append-only.** Corrections happen by adding a new movement entry (e.g. an
  adjustment), never by editing a past one.
- **A product used during a visit can trace back to the treatment that called for it, or be
  entered manually** — the vet isn't limited to a treatment's default product list.

## End-to-End Business Flows

### The Clinic Visit Flow

1. An owner arrives (walk-in or by appointment). Front-desk registers a **visit** — who the owner
   is, which pet(s) they've brought, and whether it's a medical or non-medical visit.
2. For each pet, a **vet is assigned** and a visit detail is opened for that pet.
3. The vet decides what **treatments** are needed and, separately, records the **medical
   findings** for that pet — vitals, history, diagnosis.
4. As treatments are chosen, their default products are suggested; the vet confirms, adjusts
   quantities, swaps products, or adds products manually as the case requires.
5. When the visit is finished, the products actually used become a locked-in
   **medical usage** record for that pet, and stock is reduced accordingly.
6. An **invoice** is raised from the visit, listing every treatment and product used, and payment
   is collected.

### The Walk-in Retail Sale Flow

1. A customer wants to buy products with no clinical visit involved.
2. Staff opens an **invoice** with no visit attached, adds the products being purchased, and
   collects payment.
3. Stock is reduced for the products sold.

### The Stock Flow

1. Stock **increases** when new inventory is received (a purchase), when previously sold/used
   stock is returned, or through a manual correction.
2. Stock **decreases** when a product is sold (retail or via an invoice), used during a medical
   visit, or through a manual correction/transfer out.
3. Every one of these movements is recorded permanently, and the clinic's current stock count for
   a product is simply the running total of that history.
