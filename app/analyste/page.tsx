import { redirect } from "next/navigation";
import { getCurrentUserWithProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeBond, serializeCashFlow } from "@/lib/serializers";
import { AnalystApp } from "@/components/AnalystApp";

export const dynamic = "force-dynamic";

export default async function AnalystPage() {
  const session = await getCurrentUserWithProfile();
  if (!session || session.role !== "analyste") redirect("/auth?next=/analyste");
  const [bonds, zeroCouponCurve, yieldCurve, cashFlows] = await Promise.all([
    prisma.bond.findMany({ orderBy: { maturityDate: "asc" } }),
    prisma.zeroCouponCurvePoint.findMany({ orderBy: [{ valuationDate: "desc" }, { maturityMode: "asc" }, { maturity: "asc" }] }),
    prisma.yieldCurvePoint.findMany({ orderBy: [{ valuationDate: "desc" }, { maturityDate: "asc" }] }),
    prisma.cashFlow.findMany({ orderBy: { cashFlowDate: "asc" } }),
  ]);
  return <AnalystApp email={session.email} bonds={bonds.map(serializeBond)} cashFlows={cashFlows.map(serializeCashFlow)} zeroCouponCurve={zeroCouponCurve.map((point) => ({ valuationDate: point.valuationDate.toISOString().slice(0, 10), maturityMode: point.maturityMode, maturity: point.maturity, zeroCouponRate: Number(point.zeroCouponRate) }))} yieldCurve={yieldCurve.map((point) => ({ valuationDate: point.valuationDate.toISOString().slice(0, 10), maturityDate: point.maturityDate.toISOString().slice(0, 10), daysToMaturity: point.daysToMaturity, weightedRate: Number(point.weightedRate), moneyMarketRate: point.moneyMarketRate == null ? null : Number(point.moneyMarketRate), actuarialRate: point.actuarialRate == null ? null : Number(point.actuarialRate) }))} />;
}
