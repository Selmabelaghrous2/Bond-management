"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Bond } from "@/types/bond";
import { logReportGenerated } from "@/lib/actions/bonds";

interface ReportPanelProps {
  bonds: Bond[];
}

function buildCsv(bonds: Bond[]): string {
  const header = [
    "ISIN",
    "Désignation",
    "Nominal (MAD)",
    "Taux facial (%)",
    "Échéance",
    "Prix (%)",
    "Statut",
  ];
  const rows = bonds.map((b) => [
    b.isin,
    b.name,
    b.nominal.toString(),
    b.couponRate.toString(),
    b.maturityDate,
    b.price != null ? b.price.toFixed(2) : "",
    b.status,
  ]);
  return [header, ...rows].map((row) => row.join(";")).join("\n");
}

export function ReportPanel({ bonds }: ReportPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const active = bonds.filter((b) => b.status === "active");
  const totalNominal = active.reduce((sum, b) => sum + b.nominal, 0);
  const avgCoupon =
    active.length > 0
      ? active.reduce((sum, b) => sum + b.couponRate, 0) / active.length
      : 0;

  function generate() {
    const csv = buildCsv(bonds);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const filename = `rapport-obligations-${now.toISOString().slice(0, 10)}.csv`;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    setGeneratedAt(now.toISOString());
    startTransition(async () => {
      await logReportGenerated(
        `Rapport "${filename}" généré (${bonds.length} obligations, encours actif ${totalNominal.toLocaleString("fr-FR")} MAD).`
      );
      router.refresh();
    });
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900">Générer un rapport</h2>
      <p className="mb-4 text-sm text-gray-500">
        Exporte un rapport CSV du portefeuille obligataire et l&apos;enregistre
        dans l&apos;historique.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="Obligations" value={bonds.length.toString()} />
        <SummaryCard label="Actives" value={active.length.toString()} />
        <SummaryCard
          label="Encours actif"
          value={`${totalNominal.toLocaleString("fr-FR")} MAD`}
        />
        <SummaryCard label="Coupon moyen" value={`${avgCoupon.toFixed(2)}%`} />
      </div>

      <button
        onClick={generate}
        disabled={isPending}
        className="mt-6 rounded-md bg-[#f28c28] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#e07b12] disabled:opacity-60"
      >
        {isPending ? "Génération…" : "Générer le rapport CSV"}
      </button>

      {generatedAt && (
        <p className="mt-3 text-sm text-emerald-700">
          Rapport téléchargé le {new Date(generatedAt).toLocaleString("fr-FR")}.
        </p>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
