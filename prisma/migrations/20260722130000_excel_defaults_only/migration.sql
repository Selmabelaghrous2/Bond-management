-- Ne conserver que les valeurs réellement disponibles dans le Pricer Excel.
-- La date de valeur du fichier est utilisée comme date de jouissance.
UPDATE "bonds"
SET
  "internalCode" = COALESCE("internalCode", "isin"),
  "enjoymentDate" = COALESCE("valueDate", "enjoymentDate"),
  "rateType" = CASE WHEN "isFloating" THEN 'Variable' ELSE 'Fixe' END,
  "amortizationType" = CASE WHEN "isAmortizing" THEN 'Amortissable' ELSE 'In fine' END,
  "couponPeriod" = CASE "frequency"
    WHEN 12 THEN 'Mensuelle'
    WHEN 4 THEN 'Trimestrielle'
    WHEN 2 THEN 'Semestrielle'
    ELSE 'Annuelle'
  END,
  "revisionPeriod" = NULL,
  "repaymentPeriod" = NULL;
