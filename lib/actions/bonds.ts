"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserWithProfile, requireRole } from "@/lib/auth";
import type { BondStatus } from "@/types/bond";

export type BondActionState = { error: string | null };

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

export async function createBond(input: {
  isin: string;
  name: string;
  nominal: number;
  couponRate: number;
  frequency: 1 | 2 | 4 | 12;
  issueDate: string;
  maturityDate: string;
  status: BondStatus;
}): Promise<BondActionState> {
  const session = await requireRole("backoffice");
  if (!session) return { error: "Accès refusé." };

  if (!input.isin || !input.name || !input.issueDate || !input.maturityDate) {
    return { error: "Champs requis manquants." };
  }

  try {
    const bond = await prisma.bond.create({
      data: {
        isin: input.isin,
        name: input.name,
        nominal: input.nominal,
        couponRate: input.couponRate,
        frequency: input.frequency,
        issueDate: new Date(input.issueDate),
        maturityDate: new Date(input.maturityDate),
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
  input: {
    isin: string;
    name: string;
    nominal: number;
    couponRate: number;
    frequency: 1 | 2 | 4 | 12;
    issueDate: string;
    maturityDate: string;
    status: BondStatus;
  }
): Promise<BondActionState> {
  const session = await requireRole("backoffice");
  if (!session) return { error: "Accès refusé." };

  try {
    const bond = await prisma.bond.update({
      where: { id },
      data: {
        isin: input.isin,
        name: input.name,
        nominal: input.nominal,
        couponRate: input.couponRate,
        frequency: input.frequency,
        issueDate: new Date(input.issueDate),
        maturityDate: new Date(input.maturityDate),
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
  const session = await requireRole("backoffice");
  if (!session) return { error: "Accès refusé." };

  await logHistory({
    ucId: "UC05",
    label: `Calcul — ${bondName}`,
    detail: summary,
    userId: session.id,
  });

  revalidatePath("/backoffice");
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
