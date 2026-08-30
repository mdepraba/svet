-- An invoice is not always issued to a registered owner: a walk-in buying
-- products over the counter has no visit and no owner record.
ALTER TABLE "invoice" ALTER COLUMN "owner_id" DROP NOT NULL;
