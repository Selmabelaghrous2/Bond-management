"use client";

import { useState } from "react";
import type { Bond, HistoryEntry } from "@/types/bond";
import { BondsPanel } from "@/components/BondsPanel";
import { UpdateDataPanel } from "@/components/UpdateDataPanel";
import { HistoryPanel } from "@/components/HistoryPanel";
import { CalculationsPanel } from "@/components/CalculationsPanel";
import { ReportPanel } from "@/components/ReportPanel";

type TabId = "obligations" | "update" | "history" | "calc" | "report";

const TABS: { id: TabId; ucId: string; label: string }[] = [
  { id: "obligations", ucId: "UC-02", label: "Obligations" },
  { id: "update", ucId: "UC-03", label: "Mise à jour" },
  { id: "history", ucId: "UC-04", label: "Historique" },
  { id: "calc", ucId: "UC-05", label: "Calculs" },
  { id: "report", ucId: "UC-06", label: "Rapport" },
];

export function BackOfficeApp({
  email,
  bonds,
  history,
}: {
  email: string;
  bonds: Bond[];
  history: HistoryEntry[];
}) {
  const [tab, setTab] = useState<TabId>("obligations");

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-6 py-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold text-gray-900">Espace Back Office</h1>
          <p className="text-sm text-gray-500">Connecté en tant que {email}</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "border-[#f28c28] bg-[#f28c28] text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-[#f28c28] hover:text-[#f28c28]"
              }`}
            >
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  tab === t.id ? "bg-white/20" : "bg-gray-100 text-gray-500"
                }`}
              >
                {t.ucId}
              </span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {tab === "obligations" && <BondsPanel bonds={bonds} />}
          {tab === "update" && <UpdateDataPanel bonds={bonds} />}
          {tab === "history" && <HistoryPanel entries={history} />}
          {tab === "calc" && <CalculationsPanel bonds={bonds} />}
          {tab === "report" && <ReportPanel bonds={bonds} />}
        </div>
      </div>
    </div>
  );
}
