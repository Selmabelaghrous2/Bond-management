-- Suivi des règlements des échéances par le Back Office.
ALTER TABLE "cash_flows"
  ADD COLUMN "isPaid" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "paidAt" TIMESTAMP(3);
