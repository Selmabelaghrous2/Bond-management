"use client";

import type { CashFlow } from "@/types/bond";

export function CashFlowPanel({ cashFlows }: { cashFlows: CashFlow[] }) {
  return <div>
    <h2 className="text-lg font-semibold text-gray-900">Cash-flows et échéanciers</h2>
    <p className="mb-4 text-sm text-gray-500">Flux importés depuis CashFlow_5166 et les échéanciers du Pricer.</p>
    <div className="overflow-x-auto rounded-lg border border-gray-200"><table className="min-w-full text-sm"><thead className="bg-gray-50 text-left text-xs text-gray-500"><tr><th className="px-4 py-2">Source</th><th className="px-4 py-2">Date flux</th><th className="px-4 py-2">Amortissement</th><th className="px-4 py-2">Coupon brut</th><th className="px-4 py-2">CRD</th></tr></thead><tbody className="divide-y divide-gray-100">{cashFlows.map((flow) => <tr key={flow.id}><td className="px-4 py-2 font-mono text-xs">{flow.source}</td><td className="px-4 py-2">{flow.cashFlowDate}</td><td className="px-4 py-2">{flow.principal.toLocaleString("fr-FR")}</td><td className="px-4 py-2">{flow.grossCoupon.toLocaleString("fr-FR")}</td><td className="px-4 py-2">{flow.outstanding?.toLocaleString("fr-FR") ?? "—"}</td></tr>)}</tbody></table></div>
  </div>;
}
