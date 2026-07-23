"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserWithProfile, requireRole } from "@/lib/auth";
import type { BondStatus } from "@/types/bond";

export type BondActionState = { error: string | null };
type BondInput = {
  isin: string;
  internalCode: string | null;
  name: string;
  nominal: number;
  couponRate: number;
  frequency: 1 | 2 | 4 | 12;
  issueDate: string;
  enjoymentDate: string | null;
  maturityDate: string;
  revisionDate: string | null;
  rateType: string | null;
  revisionPeriod: string | null;
  repaymentPeriod: string | null;
  amortizationType: string | null;
  couponPeriod: string | null;
  status: BondStatus;
};

async function logHistory(params: {
  ucId: "UC02" | "UC03" | "UC05" | "UC06";
  label: string;
  detail: string;
  bondId?: string;
  userId?: string;
}) {
  await prisma.historyEntry.create({
    data: {
      ucId: params.ucId,
      label: params.label,
      detail: params.detail,
      bondId: params.bondId,
      userId: params.userId,
    },
  });
}

export async function createBond(input: BondInput): Promise<BondActionState> {
  const session = await requireRole("backoffice");
  if (!session) return { error: "Accès refusé." };

  if (!input.isin || !input.name || !input.issueDate || !input.maturityDate) {
    return { error: "Champs requis manquants." };
  }

  try {
    const bond = await prisma.bond.create({
      data: {
        isin: input.isin,
        internalCode: input.internalCode || null,
        name: input.name,
        nominal: input.nominal,
        couponRate: input.couponRate,
        frequency: input.frequency,
        issueDate: new Date(input.issueDate),
        enjoymentDate: input.enjoymentDate ? new Date(input.enjoymentDate) : null,
        maturityDate: new Date(input.maturityDate),
        revisionDate: input.revisionDate ? new Date(input.revisionDate) : null,
        rateType: input.rateType || null,
        revisionPeriod: input.revisionPeriod || null,
        repaymentPeriod: input.repaymentPeriod || null,
        amortizationType: input.amortizationType || null,
        couponPeriod: input.couponPeriod || null,
        isFloating: input.rateType === "Variable" || input.rateType === "Révisable",
        isAmortizing: input.amortizationType === "Amortissable",
        status: input.status,
      },
    });
    await logHistory({
      ucId: "UC02",
      label: `Obligation créée — ${bond.name}`,
      detail: `ISIN ${bond.isin}`,
      bondId: bond.id,
      userId: session.id,
    });
  } catch {
    return { error: "Cet ISIN existe déjà ou les données sont invalides." };
  }

  revalidatePath("/backoffice");
  return { error: null };
}

export async function updateBond(
  id: string,
  input: BondInput
): Promise<BondActionState> {
  const session = await requireRole("backoffice");
  if (!session) return { error: "Accès refusé." };

  try {
    const bond = await prisma.bond.update({
      where: { id },
      data: {
        isin: input.isin,
        internalCode: input.internalCode || null,
        name: input.name,
        nominal: input.nominal,
        couponRate: input.couponRate,
        frequency: input.frequency,
        issueDate: new Date(input.issueDate),
        enjoymentDate: input.enjoymentDate ? new Date(input.enjoymentDate) : null,
        maturityDate: new Date(input.maturityDate),
        revisionDate: input.revisionDate ? new Date(input.revisionDate) : null,
        rateType: input.rateType || null,
        revisionPeriod: input.revisionPeriod || null,
        repaymentPeriod: input.repaymentPeriod || null,
        amortizationType: input.amortizationType || null,
        couponPeriod: input.couponPeriod || null,
        isFloating: input.rateType === "Variable" || input.rateType === "Révisable",
        isAmortizing: input.amortizationType === "Amortissable",
        status: input.status,
      },
    });
    await logHistory({
      ucId: "UC02",
      label: `Obligation modifiée — ${bond.name}`,
      detail: `ISIN ${bond.isin}`,
      bondId: bond.id,
      userId: session.id,
    });
  } catch {
    return { error: "Impossible de mettre à jour cette obligation." };
  }

  revalidatePath("/backoffice");
  return { error: null };
}

export async function deleteBond(id: string): Promise<BondActionState> {
  const session = await requireRole("backoffice");
  if (!session) return { error: "Accès refusé." };

  const bond = await prisma.bond.findUnique({ where: { id } });
  await prisma.bond.delete({ where: { id } }).catch(() => null);

  if (bond) {
    await logHistory({
      ucId: "UC02",
      label: `Obligation supprimée — ${bond.name}`,
      detail: `ISIN ${bond.isin}`,
      userId: session.id,
    });
  }

  revalidatePath("/backoffice");
  return { error: null };
}

export async function archiveBond(id: string): Promise<BondActionState> {
  const session = await requireRole("backoffice");
  if (!session) return { error: "Accès refusé." };

  const bond = await prisma.bond.findUnique({ where: { id } });
  if (!bond) return { error: "Obligation introuvable." };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (bond.maturityDate > today) {
    return { error: "Seules les obligations arrivées à échéance peuvent être archivées." };
  }

  await prisma.bond.update({ where: { id }, data: { status: "matured" } });
  await logHistory({
    ucId: "UC02",
    label: `Obligation archivée — ${bond.name}`,
    detail: `ISIN ${bond.isin}, échéance ${bond.maturityDate.toISOString().slice(0, 10)}`,
    bondId: bond.id,
    userId: session.id,
  });
  revalidatePath("/backoffice");
  return { error: null };
}

function addMonths(date: Date, months: number) {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = copy.getUTCDate();
  copy.setUTCDate(1);
  copy.setUTCMonth(copy.getUTCMonth() + months);
  copy.setUTCDate(Math.min(day, new Date(Date.UTC(copy.getUTCFullYear(), copy.getUTCMonth() + 1, 0)).getUTCDate()));
  return copy;
}

export async function generateCashFlows(bondId: string): Promise<BondActionState> {
  const session = await requireRole("backoffice");
  if (!session) return { error: "Accès refusé." };

  const bond = await prisma.bond.findUnique({ where: { id: bondId } });
  if (!bond) return { error: "Obligation introuvable." };
  if (bond.status === "matured") return { error: "Cette obligation est archivée." };

  const issue = new Date(`${bond.issueDate.toISOString().slice(0, 10)}T00:00:00.000Z`);
  const maturity = new Date(`${bond.maturityDate.toISOString().slice(0, 10)}T00:00:00.000Z`);
  const months = 12 / bond.frequency;
  const dates: Date[] = [];
  for (let next = addMonths(issue, months); next < maturity; next = addMonths(next, months)) dates.push(next);
  dates.push(maturity);

  const source = `BackOffice_${bond.id}`;
  const coupon = Number(bond.nominal) * Number(bond.couponRate) / 100 / bond.frequency;
  await prisma.$transaction([
    prisma.cashFlow.deleteMany({ where: { source } }),
    prisma.cashFlow.createMany({
      data: dates.map((cashFlowDate) => ({
        source,
        cashFlowDate,
        principal: cashFlowDate.getTime() === maturity.getTime() ? bond.nominal : 0,
        outstanding: cashFlowDate.getTime() === maturity.getTime() ? 0 : bond.nominal,
        couponRate: Number(bond.couponRate),
        grossCoupon: coupon,
        bondId: bond.id,
      })),
    }),
  ]);
  await logHistory({
    ucId: "UC05",
    label: `Flux générés — ${bond.name}`,
    detail: `${dates.length} échéance(s) générée(s) à partir des caractéristiques de l'obligation.`,
    bondId: bond.id,
    userId: session.id,
  });
  revalidatePath("/backoffice");
  return { error: null };
}

export async function setCashFlowPaid(id: string, paid: boolean): Promise<BondActionState> {
  const session = await requireRole("backoffice");
  if (!session) return { error: "Accès refusé." };
  const flow = await prisma.cashFlow.update({
    where: { id },
    data: { isPaid: paid, paidAt: paid ? new Date() : null },
    include: { bond: true },
  }).catch(() => null);
  if (!flow) return { error: "Flux introuvable." };
  await logHistory({
    ucId: "UC05",
    label: `Paiement ${paid ? "effectué" : "annulé"}`,
    detail: `${flow.source} — échéance ${flow.cashFlowDate.toISOString().slice(0, 10)}`,
    bondId: flow.bondId ?? undefined,
    userId: session.id,
  });
  revalidatePath("/backoffice");
  return { error: null };
}

export async function applyPriceUpdate(
  bondId: string,
  price: number,
  note: string
): Promise<BondActionState> {
  const session = await requireRole("backoffice");
  if (!session) return { error: "Accès refusé." };

  if (!Number.isFinite(price)) return { error: "Prix invalide." };

  const bond = await prisma.bond.update({
    where: { id: bondId },
    data: { price },
  });

  await logHistory({
    ucId: "UC03",
    label: `Mise à jour — ${bond.name}`,
    detail: `${note || "Mise à jour manuelle"} — nouveau prix ${price.toFixed(2)}%`,
    bondId: bond.id,
    userId: session.id,
  });

  revalidatePath("/backoffice");
  return { error: null };
}

export async function logCalculation(bondName: string, summary: string): Promise<BondActionState> {
  const session = await getCurrentUserWithProfile();
  if (session && session.role !== "backoffice" && session.role !== "analyste") {
    return { error: "Accès refusé." };
  }
  if (!session) return { error: "Accès refusé." };

  await logHistory({
    ucId: "UC05",
    label: `Calcul — ${bondName}`,
    detail: summary,
    userId: session.id,
  });

  revalidatePath("/analyste");
  return { error: null };
}

export async function logReportGenerated(summary: string): Promise<BondActionState> {
  const session = await getCurrentUserWithProfile();
  if (session && session.role !== "backoffice" && session.role !== "analyste") {
    return { error: "Access denied." };
  }
  if (!session) return { error: "Accès refusé." };

  await logHistory({
    ucId: "UC06",
    label: "Rapport généré",
    detail: summary,
    userId: session.id,
  });

  revalidatePath("/backoffice");
  return { error: null };
}
