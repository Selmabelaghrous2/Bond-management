"use client";

import type { Bond } from "@/types/bond";

export function MaturityPanel({ bonds }: { bonds: Bond[] }) {
  const upcoming = bonds.filter((bond) => bond.status === "active").sort((a, b) => a.maturityDate.localeCompare(b.maturityDate));
  return <div className="text-black"><h2 className="text-lg font-semibold">Échéances</h2><p className="mb-4 text-sm">Titres actifs classés par date d’échéance.</p><div className="space-y-2">{upcoming.map((bond) => <div key={bond.id} className="flex justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm"><span><strong>{bond.isin}</strong> — {bond.name}</span><span>{bond.maturityDate}</span></div>)}</div></div>;
}
