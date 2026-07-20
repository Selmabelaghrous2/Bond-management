import { redirect } from "next/navigation";
import { getCurrentUserWithProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeBond, serializeCashFlow, serializeHistoryEntry } from "@/lib/serializers";
import { BackOfficeApp } from "@/components/BackOfficeApp";

export const dynamic = "force-dynamic";

export default async function BackOfficePage() {
  const session = await getCurrentUserWithProfile();

  if (!session || session.role !== "backoffice") {
    redirect("/auth?next=/backoffice");
  }

  const [bonds, cashFlows, history] = await Promise.all([
    prisma.bond.findMany({ orderBy: { maturityDate: "asc" } }),
    prisma.cashFlow.findMany({ orderBy: { cashFlowDate: "asc" }, take: 1000 }),
    prisma.historyEntry.findMany({ orderBy: { timestamp: "desc" }, take: 200 }),
  ]);

  return (
    <BackOfficeApp
      email={session.email}
      bonds={bonds.map(serializeBond)}
      cashFlows={cashFlows.map(serializeCashFlow)}
      history={history.map(serializeHistoryEntry)}
    />
  );
}
