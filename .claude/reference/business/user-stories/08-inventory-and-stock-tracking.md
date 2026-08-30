# User Stories — Inventory & Stock Tracking

Covers keeping product stock counts accurate, and the full history behind those counts.

## Stock Count

- As an **Admin or front-desk staff**, I want to see the current on-hand quantity of a product at
  a glance, so I know whether it can be sold or needs reordering.
- As **front-desk staff**, I want the stock count to update automatically when a product is sold
  or used in a treatment, so I never have to update it by hand.

## Stock Movements

- As an **Admin**, I want to record stock coming in from a purchase, so newly received inventory
  is reflected in the count.
- As the **system**, I want stock to be automatically reduced when a product is sold via an
  invoice, so retail sales are always reflected in inventory.
- As the **system**, I want stock to be automatically reduced when a product is consumed during a
  finished medical visit, so clinical usage is reflected in inventory just like a sale.
- As an **Admin**, I want to record a stock return (customer return or return to supplier), so
  stock corrections from returns are tracked with a clear reason.
- As an **Admin**, I want to record a manual stock adjustment (increase or decrease), with a note
  explaining why, so discrepancies found during a physical count can be corrected transparently.
- As an **Admin**, I want to record a stock transfer in or out (e.g. between locations, once the
  clinic supports more than one), so movement between locations is tracked the same way as any
  other stock change.

## Reviewing Stock History

- As an **Admin**, I want to see the full history of movements for a product — what came in,
  what went out, and why — so I can audit discrepancies or understand usage trends.
- As an **Admin**, I want every stock movement to record which staff member triggered it (where
  applicable), so unusual adjustments can be traced back to a person.
- As an **Admin**, I want past stock movement entries to be permanent and never edited, so the
  stock history stays a trustworthy audit trail — corrections happen by adding a new entry, not
  altering an old one.
