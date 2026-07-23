"use server";

import * as XLSX from "xlsx";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export type ImportActionState = { error: string | null; message?: string; importedType?: "bonds" | "cashflows" | "maturities" };

export type ImportPreview = {
  error: string | null;
  type?: "bonds" | "cashflows" | "pricer";
  filename?: string;
  count?: number;
  unmatchedCount?: number;
  skippedCount?: number;
  previewRows?: Record<string, string | number | null>[];
  payload?: string;
};

export async function clearAllDataAction(): Promise<ImportActionState> {
  const session = await requireRole("backoffice");
  if (!session) return { error: "Accès refusé." };

  try {
    await prisma.cashFlow.deleteMany({});
    await prisma.historyEntry.deleteMany({});
    await prisma.bond.deleteMany({});
    await prisma.yieldCurvePoint.deleteMany({});
    await prisma.zeroCouponCurvePoint.deleteMany({});

    await prisma.historyEntry.create({
      data: {
        ucId: "UC03",
        label: "Réinitialisation des données",
        detail: "Toutes les données (obligations, cash-flows, courbes) ont été réinitialisées.",
        userId: session.id,
      },
    });

    revalidatePath("/backoffice");
    revalidatePath("/analyste");
    revalidatePath("/api/bonds");
    return { error: null, message: "Toutes les données ont été réinitialisées avec succès. La base est prête pour un nouvel import." };
  } catch {
    return { error: "Une erreur est survenue lors de la réinitialisation des données." };
  }
}

const BOND_REQUIRED = ["isin", "name", "nominal", "couponRate", "frequency", "issueDate", "maturityDate"] as const;
const CASH_FLOW_REQUIRED = ["cashFlowDate", "settlementDate", "principal", "couponRate", "grossCoupon"] as const;

const BOND_ALIASES: Record<string, string[]> = {
  isin: ["isin", "codeisin", "code", "identifiant"],
  name: ["nom", "libelle", "designation", "titre", "nomobligation"],
  nominal: ["nominal", "valeurnominale", "montantnominal"],
  couponRate: ["taux", "tauxfacial", "tauxcoupon", "couponrate"],
  frequency: ["frequence", "periodicite", "frequencecoupon", "periodicitecoupon"],
  issueDate: ["dateemission", "emission", "issuedate"],
  maturityDate: ["dateecheance", "echeance", "maturitydate", "maturite"],
  internalCode: ["codeinterne", "internalcode"],
  enjoymentDate: ["datedejouissance", "jouissance", "enjoymentdate"],
  revisionDate: ["datederevision", "revisiondate"],
  rateType: ["typetaux", "ratetype"],
  revisionPeriod: ["perioderevision", "revisionperiod"],
  repaymentPeriod: ["perioderemb", "perioderemboursement", "repaymentperiod"],
  amortizationType: ["typeamortissement", "amortizationtype"],
  couponPeriod: ["periodecp", "periodecoupon", "couponperiod"],
  status: ["statut", "status"],
};

const CASH_FLOW_ALIASES: Record<string, string[]> = {
  cashFlowDate: ["datetombee", "datetombe", "dateflux", "cashflowdate", "datepaiement"],
  settlementDate: ["datereglement", "dateregleent", "settlementdate"],
  principal: ["capitalamorti", "principal", "montantprincipal"],
  outstanding: ["encours", "outstanding", "capitalrestant"],
  couponRate: ["tauxcoupon", "couponrate", "taux"],
  grossCoupon: ["couponbrut", "interet", "interets", "grosscoupon"],
  bondReference: ["isin", "codeisin", "codeobligation", "code", "identifiant"],
};

type SerializedBond = {
  isin: string;
  name: string;
  nominal: number;
  couponRate: number;
  frequency: 1 | 2 | 4 | 12;
  issueDate: string;
  maturityDate: string;
  internalCode: string | null;
  enjoymentDate: string | null;
  revisionDate: string | null;
  rateType: string | null;
  revisionPeriod: string | null;
  repaymentPeriod: string | null;
  amortizationType: string | null;
  couponPeriod: string | null;
  status: "active" | "suspended" | "matured";
};

type SerializedCashFlow = {
  reference: string;
  cashFlowDate: string;
  settlementDate: string | null;
  principal: number;
  outstanding: number | null;
  couponRate: number;
  grossCoupon: number;
};

type ImportPayload =
  | { type: "bonds"; filename: string; bonds: SerializedBond[]; skippedCount?: number }
  | { type: "cashflows"; filename: string; flows: SerializedCashFlow[]; skippedCount?: number };

function normalize(value: unknown) {
  return String(value ?? "").trim().toLocaleLowerCase("fr-FR").normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9]+/g, "");
}
function text(value: unknown): string | null {
  const result = String(value ?? "").trim();
  return result ? result : null;
}
function number(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const result = Number(String(value ?? "").trim().replace(/\s/g, "").replace("%", "").replace(",", "."));
  return Number.isFinite(result) ? result : null;
}
function date(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    return parsed ? new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d)) : null;
  }
  const match = String(value ?? "").trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (match) return new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1])));
  const parsed = new Date(String(value ?? "").trim());
  return Number.isNaN(parsed.getTime()) ? null : new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
}
function frequency(value: unknown): 1 | 2 | 4 | 12 | null {
  const raw = normalize(value);
  if (["1", "annuel", "annuelle"].includes(raw)) return 1;
  if (["2", "semestriel", "semestrielle"].includes(raw)) return 2;
  if (["4", "trimestriel", "trimestrielle"].includes(raw)) return 4;
  if (["12", "mensuel", "mensuelle"].includes(raw)) return 12;
  return null;
}
function columnMap(headers: unknown[], aliases: Record<string, string[]>) {
  const names = headers.map(normalize);
  return new Map(Object.entries(aliases).flatMap(([field, values]) => {
    const index = names.findIndex((name) => values.includes(name));
    return index >= 0 ? [[field, index] as const] : [];
  }));
}
function filenameReference(name: string) {
  return name.replace(/\.[^.]+$/, "").match(/(?:cash[ _-]?flow|flux)[ _-]?([a-z0-9]+)$/i)?.[1]?.toUpperCase() ?? null;
}

/**
 * Parses and validates the complete file WITHOUT modifying the database.
 */
export async function previewObligationWorkbook(file: File): Promise<ImportPreview> {
  const session = await requireRole("backoffice");
  if (!session) return { error: "Accès refusé." };
  if (!(file instanceof File) || file.size === 0) return { error: "Sélectionnez un fichier non vide." };
  if (file.size > 15 * 1024 * 1024) return { error: "Le fichier dépasse la taille maximale de 15 Mo." };
  if (!/\.(xlsx|xlsm|xls|csv)$/i.test(file.name)) return { error: "Seuls les fichiers .xlsx, .xlsm, .xls et .csv sont acceptés." };

  let sheets: unknown[][][];
  try {
    const workbook = XLSX.read(Buffer.from(await file.arrayBuffer()), { cellDates: true, raw: true });
    sheets = workbook.SheetNames.map((name) => XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[name], { header: 1, defval: null, raw: true }) as unknown[][]);
  } catch {
    return {
      error: "Impossible d’ouvrir ce fichier. Vérifiez qu’il s’agit bien d’un fichier Excel ou CSV valide, qu’il n’est pas protégé par mot de passe et qu’il n’est pas déjà ouvert ou endommagé.",
    };
  }

  // Try Bonds
  for (const sheet of sheets) {
    for (let headerRow = 0; headerRow < Math.min(sheet.length, 10); headerRow++) {
      const headers = columnMap(sheet[headerRow], BOND_ALIASES);
      if (BOND_REQUIRED.every((field) => headers.has(field))) {
        return parseBondsForPreview(sheet, headerRow, headers, file.name);
      }
    }
  }

  // Try Cash-Flows
  for (const sheet of sheets) {
    for (let headerRow = 0; headerRow < Math.min(sheet.length, 10); headerRow++) {
      const headers = columnMap(sheet[headerRow], CASH_FLOW_ALIASES);
      if (CASH_FLOW_REQUIRED.every((field) => headers.has(field))) {
        const result = parseCashFlowsForPreview(sheet, headerRow, headers, file.name);
        if (result.error || !result.payload) return result;

        const flows = JSON.parse(result.payload).flows as SerializedCashFlow[];
        const references = [...new Set(flows.map((flow) => flow.reference))];
        const matched = await prisma.bond.findMany({
          where: { OR: [{ isin: { in: references } }, { internalCode: { in: references } }] },
          select: { isin: true, internalCode: true },
        });
        const known = new Set(matched.flatMap((bond) => [bond.isin, ...(bond.internalCode ? [bond.internalCode] : [])]).map((reference) => reference.toUpperCase()));
        const compatibleFlows = flows.filter((flow) => known.has(flow.reference));
        const skippedForReference = flows.length - compatibleFlows.length;
        if (!compatibleFlows.length) {
          return { error: "Import bloqué : aucun cash-flow ne correspond à une obligation existante." };
        }
        return {
          ...result,
          count: compatibleFlows.length,
          skippedCount: (result.skippedCount ?? 0) + skippedForReference,
          payload: JSON.stringify({ type: "cashflows", filename: file.name, flows: compatibleFlows, skippedCount: (result.skippedCount ?? 0) + skippedForReference }),
        };
      }
    }
  }

  return {
    error: "Le fichier a bien été ouvert, mais aucune ligne d’en-tête compatible n’a été trouvée. Obligations : ISIN, Nom, Nominal, Taux, Fréquence, Date émission et Maturité/Date échéance. Cash-flows : date tombe, date reglement, capital amorti, taux coupon et coupon brut. Pour un cash-flow sans colonne ISIN, nommez le fichier CashFlow_<code-obligation>.csv (ex. CashFlow_5166.csv).",
  };
}

function parseBondsForPreview(rows: unknown[][], headerRow: number, headers: Map<string, number>, filename: string): ImportPreview {
  const bonds: SerializedBond[] = [];
  const errors: string[] = [];
  const isins = new Set<string>();
  const value = (row: unknown[], field: string) => row[headers.get(field)!];

  for (let index = headerRow + 1; index < rows.length; index++) {
    const row = rows[index];
    if (!row || row.every((cell) => text(cell) === null)) continue;
    const isin = text(value(row, "isin"))?.toUpperCase() ?? "";
    const name = text(value(row, "name")) ?? "";
    const nominal = number(value(row, "nominal"));
    const couponRate = number(value(row, "couponRate"));
    const couponFrequency = frequency(value(row, "frequency"));
    const issueDate = date(value(row, "issueDate"));
    const maturityDate = date(value(row, "maturityDate"));

    const rowErrors: string[] = [];
    if (!isin) rowErrors.push("ISIN manquant");
    if (!name) rowErrors.push("nom manquant");
    if (nominal === null || nominal <= 0) rowErrors.push("nominal invalide (strictement positif requis)");
    if (couponRate === null || couponRate < 0 || couponRate > 100) rowErrors.push("taux de coupon invalide (0 à 100)");
    if (!couponFrequency) rowErrors.push("fréquence invalide (1, 2, 4, 12 ou libellé accepté)");
    if (!issueDate) rowErrors.push("date d'émission invalide");
    if (!maturityDate) rowErrors.push("date d'échéance invalide");
    if (issueDate && maturityDate && maturityDate <= issueDate) rowErrors.push("l'échéance doit être postérieure à l'émission");
    if (text(value(row, "enjoymentDate")) && !date(value(row, "enjoymentDate"))) rowErrors.push("date de jouissance invalide");
    if (text(value(row, "revisionDate")) && !date(value(row, "revisionDate"))) rowErrors.push("date de révision invalide");
    if (rowErrors.length) {
      errors.push(`ligne ${index + 1} : ${rowErrors.join(" ; ")}`);
      continue;
    }
    // TypeScript cannot infer the relationship between the detailed checks above and these values.
    if (!issueDate || !maturityDate || nominal === null || couponRate === null || !couponFrequency) continue;
    if (isins.has(isin)) {
      errors.push(`ISIN en double (${isin})`);
      continue;
    }
    isins.add(isin);

    const requestedStatus = normalize(value(row, "status"));
    const status = requestedStatus === "suspended" || requestedStatus === "suspendu" ? "suspended" : maturityDate < new Date() ? "matured" : "active";

    bonds.push({
      isin,
      name,
      nominal,
      couponRate,
      frequency: couponFrequency,
      issueDate: issueDate.toISOString(),
      maturityDate: maturityDate.toISOString(),
      internalCode: text(value(row, "internalCode")),
      enjoymentDate: date(value(row, "enjoymentDate"))?.toISOString() ?? null,
      revisionDate: date(value(row, "revisionDate"))?.toISOString() ?? null,
      rateType: text(value(row, "rateType")),
      revisionPeriod: text(value(row, "revisionPeriod")),
      repaymentPeriod: text(value(row, "repaymentPeriod")),
      amortizationType: text(value(row, "amortizationType")),
      couponPeriod: text(value(row, "couponPeriod")),
      status,
    });
  }

  if (!bonds.length) {
    return {
      error: !bonds.length ? `Import bloqué : aucune obligation valide. ${errors.slice(0, 10).join(" | ")}` : `Import bloqué : ${errors.length} erreur(s) de données. ${errors.slice(0, 10).join(" | ")}${errors.length > 10 ? " | …" : ""}`,
    };
  }

  const previewRows = bonds.slice(0, 8).map((b) => ({
    ISIN: b.isin,
    Nom: b.name,
    "Nominal (MAD)": b.nominal.toLocaleString("fr-FR"),
    "Taux (%)": b.couponRate.toString(),
    Fréquence: b.frequency === 1 ? "Annuelle" : b.frequency === 2 ? "Semestrielle" : b.frequency === 4 ? "Trimestrielle" : "Mensuelle",
    Émission: b.issueDate.split("T")[0],
    Échéance: b.maturityDate.split("T")[0],
  }));

  return {
    error: null,
    type: "bonds",
    filename,
    count: bonds.length,
    skippedCount: errors.length,
    previewRows,
    payload: JSON.stringify({ type: "bonds", filename, bonds, skippedCount: errors.length }),
  };
}

function parseCashFlowsForPreview(rows: unknown[][], headerRow: number, headers: Map<string, number>, filename: string): ImportPreview {
  const inferredReference = filenameReference(filename);
  const flows: SerializedCashFlow[] = [];
  const errors: string[] = [];
  const keys = new Set<string>();
  const value = (row: unknown[], field: string) => row[headers.get(field)!];

  for (let index = headerRow + 1; index < rows.length; index++) {
    const row = rows[index];
    if (!row || row.every((cell) => text(cell) === null)) continue;
    const reference = (text(headers.has("bondReference") ? value(row, "bondReference") : null) ?? inferredReference ?? "").toUpperCase();
    const cashFlowDate = date(value(row, "cashFlowDate"));
    const principal = number(value(row, "principal"));
    const couponRate = number(value(row, "couponRate"));
    const grossCoupon = number(value(row, "grossCoupon"));

    const settlementRaw = headers.has("settlementDate") ? value(row, "settlementDate") : null;
    const outstanding = headers.has("outstanding") ? number(value(row, "outstanding")) : null;
    const rowErrors: string[] = [];
    if (!reference) rowErrors.push("référence obligation/ISIN manquante");
    if (!cashFlowDate) rowErrors.push("date de tombée invalide");
    if (principal === null || principal < 0) rowErrors.push("capital amorti invalide (positif ou nul requis)");
    if (couponRate === null || couponRate < 0 || couponRate > 100) rowErrors.push("taux de coupon invalide (0 à 100)");
    if (grossCoupon === null || grossCoupon < 0) rowErrors.push("coupon brut invalide (positif ou nul requis)");
    if (text(settlementRaw) && !date(settlementRaw)) rowErrors.push("date de règlement invalide");
    if (headers.has("outstanding") && text(value(row, "outstanding")) && (outstanding === null || outstanding < 0)) rowErrors.push("encours invalide (positif ou nul requis)");
    if (rowErrors.length) {
      errors.push(`ligne ${index + 1} : ${rowErrors.join(" ; ")}`);
      continue;
    }
    if (!cashFlowDate || principal === null || couponRate === null || grossCoupon === null) continue;
    const key = `${reference}|${cashFlowDate.toISOString()}`;
    if (keys.has(key)) {
      errors.push(`flux en double (ligne ${index + 1})`);
      continue;
    }
    keys.add(key);

    flows.push({
      reference,
      cashFlowDate: cashFlowDate.toISOString(),
      settlementDate: (headers.has("settlementDate") ? date(value(row, "settlementDate")) : null)?.toISOString() ?? null,
      principal,
      outstanding,
      couponRate,
      grossCoupon,
    });
  }

  if (!flows.length) {
    return {
      error: !flows.length ? `Import bloqué : aucun cash-flow valide. ${errors.slice(0, 10).join(" | ")}` : `Import bloqué : ${errors.length} erreur(s) de cash-flow. ${errors.slice(0, 10).join(" | ")}${errors.length > 10 ? " | …" : ""}`,
    };
  }

  const previewRows = flows.slice(0, 8).map((f) => ({
    Réf: f.reference,
    "Date tombée": f.cashFlowDate.split("T")[0],
    "Capital (MAD)": f.principal.toLocaleString("fr-FR"),
    "Taux coupon (%)": f.couponRate.toString(),
    "Coupon brut (MAD)": f.grossCoupon.toLocaleString("fr-FR"),
  }));

  return {
    error: null,
    type: "cashflows",
    filename,
    count: flows.length,
    skippedCount: errors.length,
    previewRows,
    payload: JSON.stringify({ type: "cashflows", filename, flows, skippedCount: errors.length }),
  };
}

/**
 * Persists a fully validated import payload in one database transaction.
 */
export async function commitObligationImport(payloadJson: string): Promise<ImportActionState> {
  const session = await requireRole("backoffice");
  if (!session) return { error: "Accès refusé." };

  let payload: ImportPayload;
  try {
    payload = JSON.parse(payloadJson) as ImportPayload;
  } catch {
    return { error: "Données de prévisualisation invalides ou expirées." };
  }

  if (payload.type === "bonds") {
    const bonds: SerializedBond[] = payload.bonds;
    if (!Array.isArray(bonds) || !bonds.length) return { error: "Import bloqué : aucune obligation compatible à enregistrer." };
    try {
      await prisma.$transaction(async (tx) => {
        for (const bond of bonds) {
          await tx.bond.upsert({
            where: { isin: bond.isin },
            update: {
              ...bond,
              issueDate: new Date(bond.issueDate),
              maturityDate: new Date(bond.maturityDate),
              enjoymentDate: bond.enjoymentDate ? new Date(bond.enjoymentDate) : null,
              revisionDate: bond.revisionDate ? new Date(bond.revisionDate) : null,
              isFloating: /variable|révisable/i.test(bond.rateType ?? ""),
              isAmortizing: /amortissable/i.test(bond.amortizationType ?? ""),
            },
            create: {
              ...bond,
              issueDate: new Date(bond.issueDate),
              maturityDate: new Date(bond.maturityDate),
              enjoymentDate: bond.enjoymentDate ? new Date(bond.enjoymentDate) : null,
              revisionDate: bond.revisionDate ? new Date(bond.revisionDate) : null,
              isFloating: /variable|révisable/i.test(bond.rateType ?? ""),
              isAmortizing: /amortissable/i.test(bond.amortizationType ?? ""),
            },
          });
        }
        await tx.historyEntry.create({
          data: {
            ucId: "UC03",
            label: "Fichier d’obligations importé",
            detail: `${bonds.length} obligation(s) importée(s) ou mise(s) à jour depuis ${payload.filename}.`,
            userId: session.id,
          },
        });
      });

      revalidatePath("/backoffice");
      revalidatePath("/analyste");
      revalidatePath("/api/bonds");
      return {
        error: null,
        message: `${bonds.length} obligation(s) enregistrée(s) avec succès dans le système.${payload.skippedCount ? ` ${payload.skippedCount} ligne(s) non conforme(s) ignorée(s).` : ""}`,
        importedType: normalize(payload.filename).includes("echeance") ? "maturities" : "bonds",
      };
    } catch {
      return { error: "Erreur lors de l’enregistrement des obligations en base." };
    }
  }

  if (payload.type === "cashflows") {
    const flows: SerializedCashFlow[] = payload.flows;
    if (!Array.isArray(flows) || !flows.length) return { error: "Import bloqué : aucun cash-flow compatible à enregistrer." };
    const references = [...new Set(flows.map((flow) => flow.reference))];
    const bonds = await prisma.bond.findMany({
      where: { OR: [{ isin: { in: references } }, { internalCode: { in: references } }] },
      select: { id: true, isin: true, internalCode: true },
    });
    const bondIds = new Map(
      bonds.flatMap((bond) => [[bond.isin.toUpperCase(), bond.id], ...(bond.internalCode ? [[bond.internalCode.toUpperCase(), bond.id] as [string, string]] : [])])
    );
    const compatibleFlows = flows.filter((flow) => bondIds.has(flow.reference));
    const skippedCount = (payload.skippedCount ?? 0) + flows.length - compatibleFlows.length;
    if (!compatibleFlows.length) return { error: "Import bloqué : aucun cash-flow ne correspond à une obligation existante." };

    try {
      await prisma.$transaction(async (tx) => {
        for (const flow of compatibleFlows) {
          const cashFlowDate = new Date(flow.cashFlowDate);
          const settlementDate = flow.settlementDate ? new Date(flow.settlementDate) : null;
          await tx.cashFlow.upsert({
            where: { source_cashFlowDate: { source: `CashFlow_${flow.reference}`, cashFlowDate } },
            update: {
              settlementDate,
              principal: flow.principal,
              outstanding: flow.outstanding,
              couponRate: flow.couponRate,
              grossCoupon: flow.grossCoupon,
              bondId: bondIds.get(flow.reference) ?? null,
            },
            create: {
              source: `CashFlow_${flow.reference}`,
              cashFlowDate,
              settlementDate,
              principal: flow.principal,
              outstanding: flow.outstanding,
              couponRate: flow.couponRate,
              grossCoupon: flow.grossCoupon,
              bondId: bondIds.get(flow.reference) ?? null,
            },
          });
        }
        await tx.historyEntry.create({
          data: {
            ucId: "UC03",
            label: "Fichier de cash-flows importé",
            detail: `${compatibleFlows.length} flux importé(s) ou mis à jour depuis ${payload.filename}${skippedCount ? ` (${skippedCount} ligne(s) ignorée(s))` : ""}.`,
            userId: session.id,
          },
        });
      });

      revalidatePath("/backoffice");
      revalidatePath("/analyste");
      revalidatePath("/api/bonds");
      return {
        error: null,
        message: `${compatibleFlows.length} cash-flow(s) enregistré(s) avec succès.${skippedCount ? ` ${skippedCount} ligne(s) non conforme(s) ou non rattachée(s) ignorée(s).` : ""}`,
        importedType: "cashflows",
      };
    } catch {
      return { error: "Erreur lors de l’enregistrement des cash-flows en base." };
    }
  }

  return { error: "Type d'import inconnu." };
}

/** Validates first, then imports automatically when the file is fully compliant. */
export async function importObligationWorkbook(file: File): Promise<ImportActionState> {
  const preview = await previewObligationWorkbook(file);
  if (preview.error || !preview.payload) return { error: preview.error ?? "Erreur d’analyse." };
  return commitObligationImport(preview.payload);
}
