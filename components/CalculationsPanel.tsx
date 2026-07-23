"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Bond, CashFlow } from "@/types/bond";
import { priceBond, yieldToMaturity, type PricingResult } from "@/lib/bond-pricing";
import { logCalculation } from "@/lib/actions/bonds";

export function CalculationsPanel({ bonds, cashFlows }: { bonds: Bond[]; cashFlows: CashFlow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState(bonds[0]?.id ?? "");
  const [yieldRate, setYieldRate] = useState("4.5");
  const [valuationDate, setValuationDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [result, setResult] = useState<PricingResult | null>(null);
  const selected = bonds.find((bond) => bond.id === selectedId);
  const selectedCashFlows = cashFlows.filter((flow) => flow.bondId === selectedId);

  function run(event: React.FormEvent) {
    event.preventDefault();
    const requiredYield = Number(yieldRate);
    const valuation = new Date(`${valuationDate}T00:00:00`);
    if (!selected || !Number.isFinite(requiredYield) || selectedCashFlows.length === 0) return;
    const remaining = selectedCashFlows.filter((flow) => new Date(`${flow.cashFlowDate}T00:00:00`) >= valuation);
    if (remaining.length === 0) return;
    const normalized = remaining.map((flow) => ({ ...flow, principal: flow.principal * 100 / selected.nominal, grossCoupon: flow.grossCoupon * 100 / selected.nominal }));
    const base = priceBond(normalized, requiredYield, valuation);
    const previous = [...selectedCashFlows].filter((flow) => new Date(`${flow.cashFlowDate}T00:00:00`) < valuation).sort((a, b) => b.cashFlowDate.localeCompare(a.cashFlowDate))[0];
    const next = remaining[0];
    const periodDays = previous && next ? Math.max(1, (new Date(`${next.cashFlowDate}T00:00:00`).getTime() - new Date(`${previous.cashFlowDate}T00:00:00`).getTime()) / 86400000) : 365 / selected.frequency;
    const elapsedDays = previous ? Math.max(0, (valuation.getTime() - new Date(`${previous.cashFlowDate}T00:00:00`).getTime()) / 86400000) : 0;
    const accruedInterestPct = next ? next.grossCoupon * 100 / selected.nominal * Math.min(1, elapsedDays / periodDays) : 0;
    const marketYtm = selected.price == null ? requiredYield : yieldToMaturity(normalized, selected.price + accruedInterestPct, valuation) ?? requiredYield;
    const computed = { ...base, accruedInterestPct, dirtyPricePct: base.cleanPricePct + accruedInterestPct, yieldToMaturity: marketYtm };
    setResult(computed);
    startTransition(async () => {
      await logCalculation(selected.name, `Valorisation au ${valuationDate}: clean ${computed.cleanPricePct.toFixed(2)}%, dirty ${computed.dirtyPricePct.toFixed(2)}%, YTM ${computed.yieldToMaturity.toFixed(2)}%.`);
      router.refresh();
    });
  }

  return <div>
    <h2 className="text-lg font-semibold text-gray-900">Pricer obligataire</h2>
    <p className="mb-4 text-sm text-gray-500">Valorisez les flux futurs, calculez le Clean Price, Dirty Price, intérêts courus, YTM et durations.</p>
    <form onSubmit={run} className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-5 sm:grid-cols-3">
      <Field label="Obligation"><select value={selectedId} onChange={(e) => { setSelectedId(e.target.value); setResult(null); }} className="input">{bonds.map((bond) => <option key={bond.id} value={bond.id}>{bond.isin} — {bond.name}</option>)}</select></Field>
      <Field label="Date de valorisation"><input type="date" required value={valuationDate} onChange={(e) => setValuationDate(e.target.value)} className="input" /></Field>
      <Field label="Taux de rendement exigé (%)"><input type="number" step="0.01" required value={yieldRate} onChange={(e) => setYieldRate(e.target.value)} className="input" /></Field>
      <div className="sm:col-span-3"><button type="submit" disabled={!selected || selectedCashFlows.length === 0 || isPending} className="rounded-md bg-[#f28c28] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">{isPending ? "Calcul en cours…" : "Lancer la valorisation"}</button>{selected && selectedCashFlows.length === 0 && <span className="ml-3 text-xs text-amber-700">Aucun flux rattaché à cette obligation.</span>}</div>
    </form>
    {result && <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4"><Card label="Clean Price" value={`${result.cleanPricePct.toFixed(3)}%`} /><Card label="Dirty Price" value={`${result.dirtyPricePct.toFixed(3)}%`} /><Card label="YTM" value={`${result.yieldToMaturity.toFixed(3)}%`} /><Card label="Intérêts courus" value={`${result.accruedInterestPct.toFixed(3)}%`} /><Card label="Duration Macaulay" value={`${result.macaulayDuration.toFixed(2)} ans`} /><Card label="Duration modifiée" value={`${result.modifiedDuration.toFixed(2)} ans`} /></div>}
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-xs font-medium text-gray-600">{label}<span className="mt-1 block">{children}</span></label>; }
function Card({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-gray-200 bg-white px-4 py-3"><p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p><p className="mt-1 text-lg font-semibold text-gray-900">{value}</p></div>; }
