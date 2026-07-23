"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Bond, CashFlow } from "@/types/bond";
import { generateCashFlows, setCashFlowPaid } from "@/lib/actions/bonds";

type Props = { cashFlows: CashFlow[]; bonds?: Bond[]; title?: string; description?: string };

export function CashFlowPanel({ cashFlows, bonds = [], title = "Cash Flows", description = "Générez, contrôlez, exportez et validez les échéances de paiement." }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [discountRate, setDiscountRate] = useState("4.5");
  const [source, setSource] = useState("all");
  const [bondId, setBondId] = useState(bonds.find((bond) => bond.status === "active")?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const canManage = bonds.length > 0;
  const rate = Number(discountRate) / 100 || 0;
  const today = new Date();
  const flows = useMemo(() => cashFlows.filter((flow) => source === "all" || flow.source === source), [cashFlows, source]);
  const sources = [...new Set(cashFlows.map((flow) => flow.source))];
  const totals = flows.reduce((sum, flow) => {
    const years = Math.max(0, (new Date(`${flow.cashFlowDate}T00:00:00`).getTime() - today.getTime()) / 31557600000);
    const total = flow.principal + flow.grossCoupon;
    sum.principal += flow.principal; sum.coupon += flow.grossCoupon; sum.dcf += total / Math.pow(1 + rate, years); return sum;
  }, { principal: 0, coupon: 0, dcf: 0 });

  function generate() {
    if (!bondId) return;
    startTransition(async () => {
      const result = await generateCashFlows(bondId);
      setMessage(result.error ?? "Échéancier généré avec succès.");
      if (!result.error) router.refresh();
    });
  }

  function togglePaid(flow: CashFlow) {
    startTransition(async () => {
      const result = await setCashFlowPaid(flow.id, !flow.isPaid);
      setMessage(result.error ?? (flow.isPaid ? "Paiement remis à payer." : "Paiement marqué comme effectué."));
      if (!result.error) router.refresh();
    });
  }

  function exportExcel() {
    const header = ["Source", "Date échéance", "Amortissement", "Coupon brut", "Flux total", "Statut"];
    const lines = flows.map((flow) => [flow.source, flow.cashFlowDate, flow.principal, flow.grossCoupon, flow.principal + flow.grossCoupon, flow.isPaid ? "Payé" : "À payer"]);
    const csv = [header, ...lines].map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `cash-flows-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
  }

  return <div className="text-black">
    <h2 className="text-lg font-semibold">{title}</h2><p className="mb-4 text-sm text-gray-500">{description}</p>
    {bonds.length > 0 && <section className="mb-5 flex flex-wrap items-end gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <label className="text-xs font-medium text-gray-700">Obligation à générer<select className="input mt-1" value={bondId} onChange={(event) => setBondId(event.target.value)}>{bonds.filter((bond) => bond.status === "active").map((bond) => <option key={bond.id} value={bond.id}>{bond.isin} — {bond.name}</option>)}</select></label>
      <button type="button" onClick={generate} disabled={!bondId || isPending} className="rounded-md bg-[#f28c28] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{isPending ? "Génération…" : "Générer les flux"}</button>
      <span className="text-xs text-gray-600">Les flux précédemment générés pour ce titre seront remplacés.</span>
    </section>}
    {message && <p className={`mb-4 rounded-md px-3 py-2 text-sm ${message.includes("succès") || message.includes("effectué") || message.includes("payer") ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{message}</p>}
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4 rounded-lg bg-gray-50 p-4"><div className="flex flex-wrap gap-4"><label className="text-xs font-medium text-gray-600">Échéancier<select className="input mt-1" value={source} onChange={(e) => setSource(e.target.value)}><option value="all">Tous les flux</option>{sources.map((value) => <option key={value}>{value}</option>)}</select></label><label className="text-xs font-medium text-gray-600">Taux d’actualisation (%)<input className="input mt-1" type="number" step="0.01" value={discountRate} onChange={(e) => setDiscountRate(e.target.value)} /></label></div><div className="flex gap-2"><button type="button" onClick={exportExcel} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium">Exporter Excel</button><button type="button" onClick={() => window.print()} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium">Imprimer / PDF</button></div></div>
    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><Card label="Coupons" value={`${totals.coupon.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} MAD`} /><Card label="Remboursement" value={`${totals.principal.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} MAD`} /><Card label="Flux actualisés" value={`${totals.dcf.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} MAD`} /><Card label="Nombre de flux" value={String(flows.length)} /></div>
    <div className="overflow-x-auto rounded-lg border border-gray-200"><table className="min-w-full text-sm"><thead className="bg-gray-50 text-left text-xs"><tr><th className="px-4 py-2">Source</th><th>Date flux</th><th>Amortissement</th><th>Coupon brut</th><th>Flux total</th><th>Flux actualisé</th><th>CRD</th>{canManage && <th>Règlement</th>}</tr></thead><tbody className="divide-y divide-gray-100">{flows.map((flow) => { const years = Math.max(0, (new Date(`${flow.cashFlowDate}T00:00:00`).getTime() - today.getTime()) / 31557600000); const total = flow.principal + flow.grossCoupon; return <tr key={flow.id}><td className="px-4 py-2 font-mono text-xs">{flow.source}</td><td>{flow.cashFlowDate}</td><td>{flow.principal.toLocaleString("fr-FR")}</td><td>{flow.grossCoupon.toLocaleString("fr-FR")}</td><td>{total.toLocaleString("fr-FR")}</td><td>{(total / Math.pow(1 + rate, years)).toLocaleString("fr-FR", { maximumFractionDigits: 2 })}</td><td>{flow.outstanding?.toLocaleString("fr-FR") ?? "—"}</td>{canManage && <td><button type="button" disabled={isPending} onClick={() => togglePaid(flow)} className={`rounded px-2 py-1 text-xs font-medium ${flow.isPaid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{flow.isPaid ? "Payé" : "À payer"}</button></td>}</tr>; })}{flows.length === 0 && <tr><td colSpan={canManage ? 8 : 7} className="px-4 py-6 text-center text-gray-400">Aucun flux disponible.</td></tr>}</tbody></table></div>
  </div>;
}

function Card({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-gray-200 bg-white px-3 py-3"><p className="text-xs uppercase tracking-wide text-gray-400">{label}</p><p className="mt-1 text-sm font-semibold text-gray-900">{value}</p></div>; }
