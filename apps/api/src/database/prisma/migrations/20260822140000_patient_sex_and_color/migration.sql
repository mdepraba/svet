-- The patient intake form records sex and markings alongside species and
-- breed. Both are nullable: a pet brought in on an emergency is registered
-- from whatever the owner can say at the desk.
ALTER TABLE "patient" ADD COLUMN "sex" TEXT;
ALTER TABLE "patient" ADD COLUMN "color" TEXT;
