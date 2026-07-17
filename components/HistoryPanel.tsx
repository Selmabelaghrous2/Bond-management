"use client";

import { useState } from "react";
import type { HistoryEntry, HistoryUseCase } from "@/types/bond";

const FILTERS: { value: HistoryUseCase | "all"; label: string }[] = [
  { value: "all", label: "Tout" },
  { value: "UC02", label: "Obligations" },
  { value: "UC03", label: "Mises à jour" },
  { value: "UC05", label: "Calculs" },
  { value: "UC06", label: "Rapports" },
];

const UC_STYLES: Record<HistoryUseCase, string> = {
  UC02: "bg-gray-100 text-gray-600",
  UC03: "bg-sky-50 text-sky-700",
  UC05: "bg-violet-50 text-violet-700",
  UC06: "bg-amber-50 text-amber-700",
  UC08: "bg-purple-50 text-purple-700",
};

export function HistoryPanel({ entries }: { entries: HistoryEntry[] }) {
  const [filter, setFilter] = useState<HistoryUseCase | "all">("all");

  const visible = entries.filter((e) => filter === "all" || e.ucId === filter);

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900">Consulter l&apos;historique</h2>
      <p className="mb-4 text-sm text-gray-500">
        Cet historique est alimenté automatiquement par la gestion des
        obligations (UC-02), les mises à jour de données (UC-03), les
        calculs (UC-05) et les rapports générés (UC-06).
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filter === f.value
                ? "border-[#f28c28] bg-[#f28c28] text-white"
                : "border-gray-300 text-gray-600 hover:border-[#f28c28] hover:text-[#f28c28]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ol className="space-y-3">
        {visible.length === 0 && (
          <li className="rounded-md border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-400">
            Aucun évènement pour ce filtre.
          </li>
        )}
        {visible.map((entry) => (
          <li
            key={entry.id}
            className="flex items-start gap-3 rounded-lg border border-gray-200 px-4 py-3"
          >
            <span
              className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${UC_STYLES[entry.ucId]}`}
            >
              {entry.ucId}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">{entry.label}</p>
              <p className="text-sm text-gray-500">{entry.detail}</p>
              <p className="mt-1 text-xs text-gray-400">
                {new Date(entry.timestamp).toLocaleString("fr-FR")}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
