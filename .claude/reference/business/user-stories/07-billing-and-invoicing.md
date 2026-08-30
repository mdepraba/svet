# User Stories — Billing & Invoicing (Point of Sale)

Covers turning a visit — or a standalone retail sale — into an invoice, and collecting payment.

## Creating an Invoice

- As **front-desk staff**, I want to generate an invoice directly from a finished visit, with all
  its treatments and products already listed, so I don't have to re-enter what happened.
- As **front-desk staff**, I want to create a standalone invoice with no visit attached, so I can
  sell products to a walk-in customer who isn't having their pet examined.
- As **front-desk staff**, I want each invoice to have a unique identifier/number, so it can be
  referenced, printed, and reconciled unambiguously.
- As **front-desk staff**, I want the invoice to automatically total the base price, tax, and any
  discount into a final amount, so I don't have to calculate it by hand.
- As **front-desk staff**, I want the price of each item on the invoice to be locked in at the
  moment of sale, so a later price change to that product or treatment never alters a past bill.

## Line Items

- As **front-desk staff**, I want to add a product or a treatment as a line item on an invoice,
  with its quantity and price, so the bill reflects exactly what the customer is paying for.
- As **front-desk staff**, I want to add a note to a line item (e.g. a special instruction or
  reason for a manual discount), so context isn't lost.

## Payment

- As **front-desk staff**, I want to record the payment method used (Cash, QRIS, or Bank
  Transfer), so payment reconciliation is accurate.
- As **front-desk staff**, I want to mark an invoice as Paid and capture the time of payment, so
  the clinic's books reflect when money was actually received.
- As an **Admin**, I want to cancel an invoice that shouldn't go through (e.g. entered in error),
  so it doesn't count toward revenue or trigger stock deductions.
- As an **Admin**, I want to see an invoice's current status (Pending, Paid, Cancelled) at a
  glance, so outstanding payments are easy to track down.

## Reviewing Invoices

- As **front-desk staff or Admin**, I want to look up past invoices by owner, so I can answer
  billing questions or reprint a receipt.
- As an **Admin**, I want to review invoices tied to a specific visit versus standalone retail
  sales separately, so I can understand how much revenue comes from each side of the business.
