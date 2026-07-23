"use client";

import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";

export type DashboardTab<T extends string> = { id: T; label: string; icon: LucideIcon };

export function DashboardShell<T extends string>({ area, email, tabs, tab, onTabChange, children }: {
  area: string;
  email: string;
  tabs: readonly DashboardTab<T>[];
  tab: T;
  onTabChange: (tab: T) => void;
  children: ReactNode;
}) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const activeTab = tabs.find((item) => item.id === tab);

  return <div data-admin-shell={area === "Administrateur" ? "true" : undefined} className="min-h-screen bg-slate-100">
    <aside aria-label={`Navigation ${area}`} onMouseEnter={() => setIsSidebarExpanded(true)} onMouseLeave={() => setIsSidebarExpanded(false)} className={`fixed inset-y-0 left-0 z-40 overflow-hidden bg-[#111c2f] shadow-2xl transition-[width] duration-300 ease-in-out ${isSidebarExpanded ? "w-[304px]" : "w-[76px]"}`}>
      <div className="flex h-full w-[304px] flex-col">
        <div className="flex h-24 items-center border-b border-white/10 px-6"><div className={`whitespace-nowrap transition-opacity duration-200 ${isSidebarExpanded ? "opacity-100" : "opacity-0"}`}><p className="text-sm font-bold tracking-wide text-white">Bond Manager</p><p className="mt-0.5 text-xs text-slate-400">{area}</p></div></div>
        <nav className="flex-1 px-3 py-6">
          <p className={`mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 transition-opacity duration-200 ${isSidebarExpanded ? "opacity-100" : "opacity-0"}`}>Opérations</p>
          {tabs.map((item) => { const Icon = item.icon; const isActive = tab === item.id; return <button key={item.id} type="button" title={item.label} onClick={() => onTabChange(item.id)} className={`group mb-1 flex h-12 w-full items-center border-l-2 px-3 text-left transition-colors ${isActive ? "border-[#f28c28] bg-white/10 text-white" : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white"}`}><Icon className="h-5 w-5 shrink-0" aria-hidden="true" /><span className={`ml-4 whitespace-nowrap text-sm font-semibold transition-opacity duration-200 ${isSidebarExpanded ? "opacity-100" : "opacity-0"}`}>{item.label}</span></button>; })}
        </nav>
        <div className="border-t border-white/10 px-6 py-5"><p className={`whitespace-nowrap text-xs text-slate-400 transition-opacity duration-200 ${isSidebarExpanded ? "opacity-100" : "opacity-0"}`}>Gestion obligataire</p></div>
      </div>
    </aside>
    <main className="min-h-screen transition-[padding] duration-300 ease-in-out" style={{ paddingLeft: isSidebarExpanded ? "304px" : "76px" }}>
      <header className="border-b border-slate-200 bg-white px-8 py-7"><p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-[#f28c28]">Gestion obligataire</p><div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-bold tracking-tight text-[#0f1f3d]">Espace {area}</h1><p className="mt-1 text-sm text-slate-500">Connecté en tant que {email}</p></div><p className="border-l-2 border-[#f28c28] pl-3 text-sm font-semibold text-slate-600">{activeTab?.label}</p></div></header>
      <div className="p-8"><div className="mb-3 flex justify-end"><LogoutButton /></div><div className="border border-slate-300 bg-white p-6 shadow-sm">{children}</div></div>
    </main>
  </div>;
}
