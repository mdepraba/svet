# User Stories — Visits & Examinations

Covers registering a clinic visit, assigning vets to each pet seen, and recording which
treatments and products were used during the visit. This is the operational core of a day at
the clinic.

## Registering a Visit

- As **front-desk staff**, I want to register a visit for an owner, choosing whether it's a
  Medical or Non-Medical visit and the date/time, so the clinic has a record of the encounter.
- As **front-desk staff**, I want to schedule a future visit (an appointment) rather than
  registering a walk-in on the spot, so the clinic can plan ahead.
- As **front-desk staff**, I want to see a visit automatically move from Scheduled to Ongoing once
  it's time and the pet has arrived, and to Cancelled if it's missed, so visit statuses stay
  accurate without manual bookkeeping for every case.
- As **front-desk staff**, I want to cancel a visit that won't go ahead, so the schedule reflects
  reality.
- As **front-desk staff**, I want to search past and upcoming visits (e.g. by owner name), so I
  can look up what happened on a given day or follow up on an appointment.

## Assigning Pets and Vets Within a Visit

- As **front-desk staff**, I want to add each pet the owner brought to the visit and assign a vet
  to each one, so a single visit can properly cover multiple animals, each seen by the right
  person.
- As a **Vet**, I want to see which pets are assigned to me for a given visit, so I know my
  workload for that encounter.

## Choosing Treatments and Products During a Visit

- As a **Vet**, I want to select which treatments were performed on a pet during its visit, so
  the record reflects the actual care given.
- As a **Vet**, I want the system to suggest the standard products a chosen treatment normally
  uses, so I don't have to remember or re-enter them every time.
- As a **Vet**, I want to change the quantity of a suggested product, swap it for a different
  product, or remove it, so the record matches what actually happened for this specific animal.
- As a **Vet**, I want to add a product manually that wasn't part of any treatment's standard list
  (e.g. an extra flea treatment dosed by the pet's weight), so unusual cases are still captured
  correctly.
- As **front-desk staff or a Vet**, I want to see, for each product used, whether it came from a
  treatment's default list or was added manually, so it's clear why it's on the record.

## Finishing a Visit

- As a **Vet**, I want to save a visit as a draft while it's still in progress, so I don't lose
  work if the examination takes place over multiple steps.
- As a **Vet**, I want to mark a visit as finished once all pets have been seen and everything is
  recorded, so it moves out of the active queue and its usage/billing can proceed.
- As **front-desk staff**, I want a finished (or cancelled) visit to be locked from further
  editing of what was used, so the clinical and billing record for that visit can't be
  accidentally changed later.
