-- A service can be performed more than once in a visit (two injections, two
-- nail trims), and the visit worksheet prices each line by quantity. The
-- shared zod schema already required `qty`; the column was missing.
ALTER TABLE "visit_treatment_assoc" ADD COLUMN "qty" INTEGER NOT NULL DEFAULT 1;
