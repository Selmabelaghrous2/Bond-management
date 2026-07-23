-- « Taux/Révisable = Oui » dans l'Excel est présenté comme « Révisable ».
UPDATE "bonds"
SET "rateType" = 'Révisable'
WHERE "isFloating" = true AND "rateType" = 'Variable';
