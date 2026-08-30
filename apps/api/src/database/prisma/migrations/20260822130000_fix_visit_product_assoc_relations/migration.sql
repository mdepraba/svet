-- `visit_product_assoc.product_id` never had a foreign key, and
-- `visit_treatment_assoc_id` pointed at `treatment` rather than at the
-- `visit_treatment_assoc` row it is named after — so "which service did this
-- product come from" could not be answered from the data.
ALTER TABLE "visit_product_assoc"
  DROP CONSTRAINT IF EXISTS "visit_product_assoc_visitTreatmentAssocId_fkey";

ALTER TABLE "visit_product_assoc"
  ADD CONSTRAINT "visit_product_assoc_visitTreatmentAssocId_fkey"
  FOREIGN KEY ("visitTreatmentAssocId") REFERENCES "visit_treatment_assoc"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "visit_product_assoc"
  ADD CONSTRAINT "visit_product_assoc_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "product"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- One running-total row per product, so stock can be upserted by product.
CREATE UNIQUE INDEX "product_stock_product_id_key" ON "product_stock"("product_id");
