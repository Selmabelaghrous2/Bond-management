"use client";

import { useState } from "react";
import Link from "next/link";
import { Banknote, Calculator, ChartNoAxesCombined, FileText, FolderKanban, FlaskConical, TableProperties } from "lucide-react";
import type { Bond, CashFlow } from "@/types/bond";
import { DashboardShell } from "@/components/DashboardShell";
import { CalculationsPanel } from "@/components/CalculationsPanel";
import { CashFlowPanel } from "@/components/CashFlowPanel";
import { ReportPanel } from "@/components/ReportPanel";

type ZeroCouponPoint = { valuationDate: string; maturityMode: string; maturity: number; zeroCouponRate: number };
type YieldCurvePoint = { valuationDate: string; maturityDate: string; daysToMaturity: number; weightedRate: number; moneyMarketRate: number | null; actuarialRate: number | null };
type Tab = "bonds" | "pricer" | "cashflows" | "curves" | "portfolio" | "simulation" | "report";

const REFERENCE_DATE_MS = 1784678400000;
const TABS = [
  { id: "bonds", label: "Obligations", icon: TableProperties },
  { id: "pricer", label: "Pricer", icon: Calculator },
  { id: "cashflows", label: "Cash Flows", icon: Banknote },
  { id: "curves", label: "Zero Coupon Curve", icon: ChartNoAxesCombined },
  { id: "portfolio", label: "Portefeuille", icon: FolderKanban },
  { id: "simulation", label: "Simulation", icon: FlaskConical },
  { id: "report", label: "Rapports", icon: FileText },
] as const;

export function AnalystApp({
  email,
  bonds,
  cashFlows,
  zeroCouponCurve,
  yieldCurve,
}: {
  email: string;
  bonds: Bond[];
  cashFlows: CashFlow[];
  zeroCouponCurve: ZeroCouponPoint[];
  yieldCurve: YieldCurvePoint[];
}) {
  const [tab, setTab] = useState<Tab>("bonds");

  return (
    <DashboardShell area="Analyste Financier" email={email} tabs={TABS} tab={tab} onTabChange={setTab}>
      {tab === "bonds" && <BondsAnalysisPanel bonds={bonds} />}
      {tab === "pricer" && <CalculationsPanel bonds={bonds} cashFlows={cashFlows} />}
      {tab === "cashflows" && <CashFlowPanel cashFlows={cashFlows} />}
      {tab === "curves" && <CurvesPanel zeroCouponCurve={zeroCouponCurve} yieldCurve={yieldCurve} />}
      {tab === "portfolio" && <PortfolioPanel bonds={bonds} />}
      {tab === "simulation" && <SimulationPanel bonds={bonds} />}
      {tab === "report" && <ReportPanel bonds={bonds} />}
    </DashboardShell>
  );
}

function BondsAnalysisPanel({ bonds }: { bonds: Bond[] }) {
  const [selection, setSelection] = useState<string[]>(bonds.slice(0, 2).map((bond) => bond.id));
  const selected = bonds.filter((bond) => selection.includes(bond.id));

  const toggle = (id: string) => {
    setSelection((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id].slice(-3)));
  };

  const openComparison = () => {
    if (selected.length < 2) return;
    return `/analyste/comparaison?ids=${encodeURIComponent(selected.map((bond) => bond.id).join(","))}`;
  };

  return (
    <div className="text-black">
      <h2 className="text-lg font-semibold">Obligations - consultation et comparaison</h2>
      <p className="mb-4 text-sm text-gray-500">Selectionnez jusqu a trois obligations pour comparer coupon, echeance, prix et rendement indicatif.</p>

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">{selected.length} selectionnee(s)</p>
        {selected.length >= 2 ? (
          <Link
            href={openComparison() ?? "/analyste"}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-[#f28c28] px-4 py-2 text-sm font-medium text-white"
          >
            Comparer
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="rounded-md bg-[#f28c28] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Comparer
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs">
            <tr>
              <th className="px-3 py-2">Comparer</th>
              <th>Code</th>
              <th>Nominal</th>
              <th>Coupon</th>
              <th>Echeance</th>
              <th>Frequence</th>
              <th>Prix marche</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {bonds.map((bond) => (
              <tr key={bond.id} className="border-t">
                <td className="px-3 py-2">
                  <input
                    aria-label={`Comparer ${bond.isin}`}
                    type="checkbox"
                    checked={selection.includes(bond.id)}
                    onChange={() => toggle(bond.id)}
                  />
                </td>
                <td className="font-mono">{bond.isin}</td>
                <td>{bond.nominal.toLocaleString("fr-FR")} MAD</td>
                <td>{bond.couponRate.toFixed(3)}%</td>
                <td>{bond.maturityDate}</td>
                <td>{bond.frequency}/an</td>
                <td>{bond.price == null ? "—" : `${bond.price.toFixed(3)}%`}</td>
                <td>{bond.isFloating ? "Revisable" : "Fixe"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {selected.map((bond) => (
            <div key={bond.id} className="rounded-lg border border-slate-200 p-4">
              <p className="font-mono text-xs text-slate-500">{bond.isin}</p>
              <h3 className="mt-1 font-semibold">{bond.name}</h3>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt>Coupon</dt>
                  <dd>{bond.couponRate.toFixed(3)}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Maturite</dt>
                  <dd>{bond.maturityDate}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Rendement indicatif</dt>
                  <dd>{bond.price ? `${(bond.couponRate / bond.price * 100).toFixed(2)}%` : "—"}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CurvesPanel({ zeroCouponCurve, yieldCurve }: { zeroCouponCurve: ZeroCouponPoint[]; yieldCurve: YieldCurvePoint[] }) {
  const dates = [...new Set(zeroCouponCurve.map((point) => point.valuationDate))];
  const [date, setDate] = useState(dates[0] ?? "");
  const [spread, setSpread] = useState("0");
  const points = zeroCouponCurve.filter((point) => point.valuationDate === date);
  const shift = Number(spread) || 0;

  return (
    <div className="space-y-6 text-black">
      <div>
        <h2 className="text-lg font-semibold">Zero Coupon Curve</h2>
        <p className="text-sm text-gray-500">Selectionnez la courbe utilisee pour la valorisation et visualisez l effet d un deplacement parallele.</p>
      </div>

      <div className="flex flex-wrap gap-4 rounded-lg bg-gray-50 p-4">
        <label className="text-xs font-medium">
          Date de courbe
          <select className="input mt-1" value={date} onChange={(e) => setDate(e.target.value)}>
            {dates.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium">
          Decalage simule (pb)
          <input className="input mt-1" type="number" value={spread} onChange={(e) => setSpread(e.target.value)} />
        </label>
        <p className="self-end pb-2 text-sm text-slate-600">
          Impact : taux de la courbe {shift >= 0 ? "+" : ""}
          {shift} pb
        </p>
      </div>

      <CurveTable points={points} shift={shift} />

      <section>
        <h3 className="mb-2 font-semibold">Courbe de taux de marche</h3>
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs">
              <tr>
                <th className="px-3 py-2">Maturite</th>
                <th>Jours</th>
                <th>Taux pondere</th>
                <th>Monetaire</th>
                <th>Actuariel</th>
              </tr>
            </thead>
            <tbody>
              {yieldCurve.slice(0, 30).map((point) => (
                <tr key={`${point.valuationDate}-${point.maturityDate}`} className="border-t">
                  <td className="px-3 py-2">{point.maturityDate}</td>
                  <td>{point.daysToMaturity}</td>
                  <td>{point.weightedRate.toFixed(4)}%</td>
                  <td>{point.moneyMarketRate?.toFixed(4) ?? "—"}</td>
                  <td>{point.actuarialRate?.toFixed(4) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function CurveTable({ points, shift }: { points: ZeroCouponPoint[]; shift: number }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs">
          <tr>
            <th className="px-3 py-2">Maturite</th>
            <th>Unite</th>
            <th>Taux ZC</th>
            <th>Taux scenario</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={`${point.maturityMode}-${point.maturity}`} className="border-t">
              <td className="px-3 py-2">{point.maturity}</td>
              <td>{point.maturityMode}</td>
              <td>{point.zeroCouponRate.toFixed(5)}%</td>
              <td>{(point.zeroCouponRate + shift / 100).toFixed(5)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PortfolioPanel({ bonds }: { bonds: Bond[] }) {
  const active = bonds.filter((bond) => bond.status === "active");
  const total = active.reduce((sum, bond) => sum + bond.nominal * ((bond.price ?? 100) / 100), 0);
  const avgCoupon = active.length ? active.reduce((sum, bond) => sum + bond.couponRate, 0) / active.length : 0;
  const risk = [...active].sort((a, b) => a.maturityDate.localeCompare(b.maturityDate)).slice(-5);

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900">Portefeuille obligataire</h2>
      <p className="mb-5 text-sm text-gray-500">Suivi de la valeur, du rendement et des sensibilites les plus elevees.</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Metric label="Valeur de marche" value={`${total.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} MAD`} />
        <Metric label="Lignes actives" value={String(active.length)} />
        <Metric label="Coupon moyen" value={`${avgCoupon.toFixed(2)}%`} />
        <Metric label="Prix moyen" value={`${(active.reduce((sum, bond) => sum + (bond.price ?? 100), 0) / Math.max(1, active.length)).toFixed(2)}%`} />
      </div>
      <h3 className="mt-7 mb-2 font-semibold">Obligations a surveiller - maturites longues</h3>
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs">
            <tr>
              <th className="px-3 py-2">Code</th>
              <th>Echeance</th>
              <th>Prix</th>
              <th>Signal</th>
            </tr>
          </thead>
          <tbody>
            {risk.map((bond) => (
              <tr className="border-t" key={bond.id}>
                <td className="px-3 py-2 font-mono">{bond.isin}</td>
                <td>{bond.maturityDate}</td>
                <td>{bond.price?.toFixed(2) ?? "—"}%</td>
                <td className="text-amber-700">Sensibilite taux potentiellement elevee</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SimulationPanel({ bonds }: { bonds: Bond[] }) {
  const [shift, setShift] = useState("100");
  const [couponShift, setCouponShift] = useState("0");
  const rateShift = Number(shift) || 0;
  const coupon = Number(couponShift) || 0;

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900">Simulation de scenarios</h2>
      <p className="mb-4 text-sm text-gray-500">Estimation de l impact des taux et du coupon sur le prix. Une hausse des taux diminue la valeur des obligations.</p>
      <div className="flex flex-wrap gap-4 rounded-lg bg-gray-50 p-4">
        <label className="text-xs font-medium">
          Variation de taux (pb)
          <input className="input mt-1" type="number" value={shift} onChange={(e) => setShift(e.target.value)} />
        </label>
        <label className="text-xs font-medium">
          Variation du coupon (pb)
          <input className="input mt-1" type="number" value={couponShift} onChange={(e) => setCouponShift(e.target.value)} />
        </label>
      </div>
      <div className="mt-5 overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs">
            <tr>
              <th className="px-3 py-2">Obligation</th>
              <th>Prix initial</th>
              <th>Variation estimee</th>
              <th>Prix simule</th>
            </tr>
          </thead>
          <tbody>
            {bonds
              .filter((bond) => bond.status === "active")
              .map((bond) => {
                const years = Math.max(0, (new Date(`${bond.maturityDate}T00:00:00`).getTime() - REFERENCE_DATE_MS) / 31557600000);
                const duration = Math.min(12, Math.max(0.5, years * 0.65));
                const initial = bond.price ?? 100;
                const change = -duration * rateShift / 10000 * initial + coupon / 100;

                return (
                  <tr className="border-t" key={bond.id}>
                    <td className="px-3 py-2 font-mono">{bond.isin}</td>
                    <td>{initial.toFixed(2)}%</td>
                    <td className={change < 0 ? "text-rose-700" : "text-emerald-700"}>
                      {change >= 0 ? "+" : ""}
                      {change.toFixed(2)} pt
                    </td>
                    <td>{(initial + change).toFixed(2)}%</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
