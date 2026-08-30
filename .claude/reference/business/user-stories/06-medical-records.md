# User Stories — Medical Records

Covers the clinical write-up for a pet's visit, and the final, locked record of what was
actually used in its care.

## Medical Record

- As a **Vet**, I want to record a pet's vital signs (temperature, pulse, respiration, weight)
  during a visit, so there's an objective record of the animal's condition at that time.
- As a **Vet**, I want to record the anamnesis (owner-reported history/complaint), my diagnosis,
  and the treatment plan, so the case is fully documented.
- As a **Vet**, I want to update a medical record while the visit is still in progress, so I can
  correct or add detail before it's finalized.
- As a **Vet or Admin**, I want to look up a pet's past medical records, so I can see its history
  before deciding on new care.
- As an **Admin**, I want a pet's medical records to remain intact even if the pet's or visit's
  own record is later archived, so clinical history is never lost.

## Medical Usage (Locked Usage Record)

- As an **Admin**, I want the products actually used in a pet's care to be captured as a
  permanent usage record once the visit is finished, so there's a trustworthy link between what
  the medical record says was done and what stock was actually consumed.
- As an **Admin**, I want a finalized medical usage record to never be editable, so both the
  clinical history and the inventory numbers it fed into stay reliable.
- As an **Admin or Vet**, I want to see, for a given medical record, exactly which products were
  used and in what quantity, so usage can be reviewed or audited later if needed.
