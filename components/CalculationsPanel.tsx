"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Bond, CashFlow } from "@/types/bond";
import { priceBond, type PricingResult } from "@/lib/bond-pricing";
import { logCalculation } from "@/lib/actions/bonds";

interface CalculationsPanelProps {
  bonds: Bond[];
  cashFlows: CashFlow[];
}

export function CalculationsPanel({ bonds, cashFlows }: CalculationsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string>(bonds[0]?.id ?? "");
  const [yieldRate, setYieldRate] = useState<string>("4.5");
  const [result, setResult] = useState<PricingResult | null>(null);

  const selected = bonds.find((b) => b.id === selectedId) ?? null;

  function run(e: React.FormEvent) {
    e.preventDefault();
    const rate = Number(yieldRate);
    if (!selected || !Number.isFinite(rate)) return;

    if (selected.isin !== "5166" || cashFlows.length === 0) return;
    const computed = priceBond(cashFlows, rate);
    setResult(computed);

    startTransition(async () => {
      await logCalculation(
        selected.name,
        `Taux exigé ${rate.toFixed(2)}% → prix théorique ${computed.cleanPricePct.toFixed(2)}%, duration ${computed.macaulayDuration.toFixed(2)} ans`
      );
      router.refresh();
    });
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900">Lancer les calculs</h2>
      <p className="mb-4 text-sm text-gray-500">
        Calcule le prix théorique (actualisation des flux) et la duration
        d&apos;une obligation pour un taux de rendement donné.
      </p>

      <form
        onSubmit={run}
        className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-5 sm:grid-cols-2"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Obligation</label>
          <select
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setResult(null);
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-[#f28c28] focus:ring-2 focus:ring-[#f28c28]/20"
          >
            {bonds.map((b) => (
              <option key={b.id} value={b.id}>
                {b.isin} — {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Taux de rendement exigé (%)
          </label>
          <input
            type="number"
            step="0.01"
            required
            value={yieldRate}
            onChange={(e) => setYieldRate(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-[#f28c28] focus:ring-2 focus:ring-[#f28c28]/20"
          />
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={!selected || selected.isin !== "5166" || cashFlows.length === 0 || isPending}
            className="rounded-md bg-[#f28c28] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#e07b12] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Lancer le calcul
          </button>
        </div>
      </form>

      {result && selected && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <ResultCard label="Prix théorique" value={`${result.cleanPricePct.toFixed(2)}%`} />
          <ResultCard
            label="Prix (MAD)"
            value={result.price.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}
          />
          <ResultCard
            label="Duration Macaulay"
            value={`${result.macaulayDuration.toFixed(2)} ans`}
          />
          <ResultCard
            label="Duration modifiée"
            value={`${result.modifiedDuration.toFixed(2)} ans`}
          />
        </div>
      )}
    </div>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
