"use client";

import { useState } from "react";
import {
  Banknote,
  Building2,
  CalendarDays,
  FileText,
  History,
  RefreshCw,
  Upload,
} from "lucide-react";
import type { Bond, CashFlow, HistoryEntry } from "@/types/bond";
import { BondsPanel } from "@/components/BondsPanel";
import { UpdateDataPanel } from "@/components/UpdateDataPanel";
import { HistoryPanel } from "@/components/HistoryPanel";
import { ReportPanel } from "@/components/ReportPanel";
import { CashFlowPanel } from "@/components/CashFlowPanel";
import { MaturityPanel } from "@/components/MaturityPanel";
import { ImportPanel } from "@/components/ImportPanel";

type TabId = "obligations" | "import" | "update" | "history" | "cashflows" | "maturities" | "report";

const TABS = [
  { id: "obligations", label: "Obligations", icon: Building2 },
  { id: "import", label: "Import fichiers", icon: Upload },
  { id: "update", label: "Mise à jour", icon: RefreshCw },
  { id: "history", label: "Historique", icon: History },
  { id: "cashflows", label: "Cash-flows", icon: Banknote },
  { id: "maturities", label: "Échéances", icon: CalendarDays },
  { id: "report", label: "Rapport opérationnel", icon: FileText },
] as const satisfies ReadonlyArray<{ id: TabId; label: string; icon: typeof Building2 }>;

export function BackOfficeApp({
  email,
  bonds,
  cashFlows,
  history,
}: {
  email: string;
  bonds: Bond[];
  cashFlows: CashFlow[];
  history: HistoryEntry[];
}) {
  const [tab, setTab] = useState<TabId>("obligations");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const activeTab = TABS.find((item) => item.id === tab);

  return (
    <div className="min-h-screen bg-slate-100">
      <aside
        aria-label="Navigation Back Office"
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
        className={`fixed inset-y-0 left-0 z-40 overflow-hidden bg-[#111c2f] shadow-2xl transition-[width] duration-300 ease-in-out ${isSidebarExpanded ? "w-[304px]" : "w-[76px]"}`}
      >
        <div className="flex h-full w-[304px] flex-col">
          <div className="flex h-24 items-center border-b border-white/10 px-6">
            <div className={`whitespace-nowrap transition-opacity duration-200 ${isSidebarExpanded ? "opacity-100" : "opacity-0"}`}>
              <p className="text-sm font-bold tracking-wide text-white">Bond Manager</p>
              <p className="mt-0.5 text-xs text-slate-400">Back Office</p>
            </div>
          </div>

          <nav className="flex-1 px-3 py-6">
            <p className={`mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 transition-opacity duration-200 ${isSidebarExpanded ? "opacity-100" : "opacity-0"}`}>Opérations</p>
            {TABS.map((item) => {
              const Icon = item.icon;
              const isActive = tab === item.id;
              return <button key={item.id} type="button" title={item.label} onClick={() => setTab(item.id)} className={`group mb-1 flex h-12 w-full items-center border-l-2 px-3 text-left transition-colors ${isActive ? "border-[#f28c28] bg-white/10 text-white" : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white"}`}><Icon className="h-5 w-5 shrink-0" aria-hidden="true" /><span className={`ml-4 whitespace-nowrap text-sm font-semibold transition-opacity duration-200 ${isSidebarExpanded ? "opacity-100" : "opacity-0"}`}>{item.label}</span></button>;
            })}
          </nav>

          <div className="border-t border-white/10 px-6 py-5"><p className={`whitespace-nowrap text-xs text-slate-400 transition-opacity duration-200 ${isSidebarExpanded ? "opacity-100" : "opacity-0"}`}>Gestion obligataire</p></div>
        </div>
      </aside>

      <main className="min-h-screen transition-[padding] duration-300 ease-in-out" style={{ paddingLeft: isSidebarExpanded ? "304px" : "76px" }}>
        <header className="border-b border-slate-200 bg-white px-8 py-7">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-[#f28c28]">Gestion obligataire</p>
          <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-bold tracking-tight text-[#0f1f3d]">Espace Back Office</h1><p className="mt-1 text-sm text-slate-500">Connecté en tant que {email}</p></div><p className="border-l-2 border-[#f28c28] pl-3 text-sm font-semibold text-slate-600">{activeTab?.label}</p></div>
        </header>
        <div className="p-8"><div className="border border-slate-300 bg-white p-6 shadow-sm">
          {tab === "obligations" && <BondsPanel bonds={bonds} />}
          {tab === "import" && <ImportPanel existingCount={bonds.length} onImported={(type) => setTab(type === "cashflows" ? "cashflows" : type === "maturities" ? "maturities" : "obligations")} />}
          {tab === "update" && <UpdateDataPanel bonds={bonds} />}
          {tab === "history" && <HistoryPanel entries={history} />}
          {tab === "cashflows" && <CashFlowPanel cashFlows={cashFlows} bonds={bonds} />}
          {tab === "maturities" && <MaturityPanel bonds={bonds} />}
          {tab === "report" && <ReportPanel bonds={bonds} />}
        </div></div>
      </main>
    </div>
  );
}
