import { redirect } from "next/navigation";
import { getCurrentUserWithProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeBond, serializeCashFlow } from "@/lib/serializers";
import { AnalystApp } from "@/components/AnalystApp";

export const dynamic = "force-dynamic";

export default async function AnalystPage() {
  const session = await getCurrentUserWithProfile();
  if (!session || session.role !== "analyste") redirect("/auth?next=/analyste");
  const [bonds, cashFlows, zeroCouponCurve] = await Promise.all([
    prisma.bond.findMany({ orderBy: { maturityDate: "asc" } }),
    prisma.cashFlow.findMany({ orderBy: { cashFlowDate: "asc" }, take: 1000 }),
    prisma.zeroCouponCurvePoint.findMany({ orderBy: [{ valuationDate: "desc" }, { maturityMode: "asc" }, { maturity: "asc" }] }),
  ]);
  return <AnalystApp email={session.email} bonds={bonds.map(serializeBond)} cashFlows={cashFlows.map(serializeCashFlow)} zeroCouponCurve={zeroCouponCurve.map((point) => ({ valuationDate: point.valuationDate.toISOString().slice(0, 10), maturityMode: point.maturityMode, maturity: point.maturity, zeroCouponRate: Number(point.zeroCouponRate) }))} />;
}
