ALTER TABLE "bonds"
  ADD COLUMN "internalCode" TEXT,
  ADD COLUMN "enjoymentDate" DATE,
  ADD COLUMN "revisionDate" DATE,
  ADD COLUMN "rateType" TEXT,
  ADD COLUMN "revisionPeriod" TEXT,
  ADD COLUMN "repaymentPeriod" TEXT,
  ADD COLUMN "amortizationType" TEXT,
  ADD COLUMN "couponPeriod" TEXT;

-- Initialisation des fiches déjà présentes afin qu'elles soient immédiatement
-- exploitables dans le nouveau formulaire Back Office.
UPDATE "bonds"
SET
  "internalCode" = COALESCE("internalCode", "isin"),
  "enjoymentDate" = COALESCE("enjoymentDate", "issueDate"),
  "rateType" = COALESCE("rateType", CASE WHEN "isFloating" THEN 'Variable' ELSE 'Fixe' END),
  "revisionPeriod" = COALESCE("revisionPeriod", CASE WHEN "isFloating" THEN 'À définir' ELSE 'Non applicable' END),
  "repaymentPeriod" = COALESCE("repaymentPeriod", CASE WHEN "isAmortizing" THEN 'Selon échéancier' ELSE 'À l''échéance' END),
  "amortizationType" = COALESCE("amortizationType", CASE WHEN "isAmortizing" THEN 'Amortissable' ELSE 'In fine' END),
  "couponPeriod" = COALESCE("couponPeriod", CASE "frequency"
    WHEN 12 THEN 'Mensuelle'
    WHEN 4 THEN 'Trimestrielle'
    WHEN 2 THEN 'Semestrielle'
    ELSE 'Annuelle'
  END);
