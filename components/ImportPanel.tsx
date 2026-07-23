"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  X,
  FileCheck,
  Trash2,
  Eye,
  Check,
  AlertTriangle,
} from "lucide-react";
import { importObligationWorkbook, clearAllDataAction, ImportPreview } from "@/lib/actions/import";

export function ImportPanel({ existingCount, onImported }: { existingCount: number; onImported?: (type: "bonds" | "cashflows" | "maturities") => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  // Kept for backward-compatible rendering of the former preview block; direct import never sets it.
  const [preview] = useState<ImportPreview | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(selectedFile: File | null) {
    setMessage(null);
    setError(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      setError("Le fichier dépasse la taille maximale autorisée (15 Mo).");
      setFile(null);
      return;
    }

    const validExtensions = [".xlsx", ".xlsm", ".xls", ".csv"];
    const hasValidExt = validExtensions.some((ext) =>
      selectedFile.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExt) {
      setError("Seuls les fichiers .xlsx, .xlsm, .xls et .csv sont acceptés.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }

  function runPreview() {
    setMessage(null);
    setError(null);

    if (!file) {
      setError("Sélectionnez un fichier Excel ou CSV à analyser.");
      return;
    }

    startTransition(async () => {
      const result = await importObligationWorkbook(file);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage(result.message ?? "Enregistrement effectué avec succès.");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (result.importedType) onImported?.(result.importedType);
      router.refresh();
    });
  }

  // The former confirmation area is intentionally unreachable: a compliant file is imported immediately.
  function runCommit() {}
  function cancelPreview() {}

  function handleClearData() {
    if (!confirm("Voulez-vous vraiment effacer toutes les données enregistrées (obligations, cash-flows, etc.) ?")) return;
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await clearAllDataAction();
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage(result.message ?? "Réinitialisation terminée avec succès.");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      router.refresh();
    });
  }

  function downloadSampleBonds() {
    const csvContent =
      "isin,name,nominal,couponRate,frequency,code interne,date emission,date jouissance,maturite,date revision,type taux,periode revision,periode remb,type amort,periode CP,status\n" +
      "FR0014001XX1,Obligation Trésor 3.5% 2030,100000,3.5,1,OBL-TR-2030,2023-01-15,2023-01-15,2030-01-15,,Fixe,,À l'échéance,In Fine,Annuelle,active\n" +
      "FR0014002YY2,Bond Corporate 4.25% 2028,50000,4.25,2,CORP-425-28,2022-06-30,2022-06-30,2028-06-30,,Révisable,6 mois,À l'échéance,In Fine,Semestrielle,active";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Modele_Import_Obligations.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function downloadSampleCashFlows() {
    const csvContent =
      "date tombe,date reglement,capital amorti,taux coupon,coupon brut\n" +
      "2026-01-15,2026-01-15,0,3.5,3500\n" +
      "2027-01-15,2027-01-15,0,3.5,3500\n" +
      "2030-01-15,2030-01-15,100000,3.5,3500";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "CashFlow_FR0014001XX1.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function getDetectedFileType(filename: string) {
    const lower = filename.toLowerCase();
    if (lower.includes("cashflow") || lower.includes("flux")) return { label: "Cash-Flows", color: "text-amber-700 bg-amber-50 border-amber-200" };
    return { label: "Obligations", color: "text-blue-700 bg-blue-50 border-blue-200" };
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
  }

  return (
    <div className="max-w-3xl space-y-4 text-slate-800">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Import fichiers</h2>
      </div>

      {/* Main Import Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <UploadCloud className="h-5 w-5 text-[#f28c28]" />
            Fichier d’obligations ou de cash-flows
          </h3>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500 font-medium">
            Max 15 Mo
          </span>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-4 relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-[#f28c28] bg-[#f28c28]/5 scale-[0.99]"
              : file
              ? "border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50/50"
              : "border-slate-300 bg-slate-50/60 hover:border-[#f28c28] hover:bg-slate-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xlsm,.xls,.csv,text/csv"
            onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
            disabled={isPending}
            className="hidden"
          />

          {!file ? (
            <>
              <div className="rounded-full bg-amber-100/80 p-3.5 text-[#f28c28]">
                <UploadCloud className="h-7 w-7" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">
                Glissez votre fichier ici, ou <span className="text-[#f28c28] underline underline-offset-2">parcourez</span>
              </p>
              <p className="mt-1 text-xs text-slate-400">
                .xlsx, .xlsm, .xls, .csv
              </p>
            </>
          ) : (
            <div className="w-full">
              <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800 truncate max-w-[260px]">
                      {file.name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs">
                      <span className="text-slate-500">{formatFileSize(file.size)}</span>
                      <span className="text-slate-300">•</span>
                      {(() => {
                        const detected = getDetectedFileType(file.name);
                        return (
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${detected.color}`}>
                            {detected.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                  title="Retirer ce fichier"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sample Templates */}
        <div className="mt-4 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Download className="h-3.5 w-3.5 text-[#f28c28]" />
            Modèles d&apos;exemples :
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={downloadSampleBonds}
              className="text-xs text-blue-700 hover:underline font-medium"
            >
              Exemple Obligations (.csv)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={downloadSampleCashFlows}
              className="text-xs text-amber-700 hover:underline font-medium"
            >
              Exemple Cash-Flows (.csv)
            </button>
          </div>
        </div>

        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <span className="font-semibold">Colonnes cash-flow attendues :</span>{" "}
          date tombe, date reglement, capital amorti, taux coupon, coupon brut.
        </p>

        {/* Action Toolbar */}
        <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={runPreview}
            disabled={!file || isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-[#f28c28] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#e07b12] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Eye className="h-4 w-4" />
            {isPending ? "Validation et import en cours…" : "Valider et importer le fichier"}
          </button>

          <button
            type="button"
            onClick={() => router.refresh()}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
            Actualiser
          </button>

          {existingCount > 0 && (
            <button
              type="button"
              onClick={handleClearData}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60 sm:ml-auto"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
              Réinitialiser la base
            </button>
          )}
        </div>
      </div>

      {/* Database State Status Badge */}
      <div className={`rounded-lg px-4 py-3 text-sm font-medium ${existingCount === 0 ? "bg-amber-50 text-amber-900 border border-amber-200" : "bg-slate-100 text-slate-800 border border-slate-200"}`}>
        {existingCount === 0 ? (
          "Aucune donnée enregistrée en base. Importez et validez un fichier pour alimenter la plateforme."
        ) : (
          `${existingCount} obligation(s) actuellement disponible(s) en base.`
        )}
      </div>

      {/* Feedback Messages */}
      {message && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{message}</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-900">Import impossible</h4>
            <p className="mt-0.5 text-xs text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Preview Card & Confirmation Step */}
      {preview && !error && (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/20 p-6 shadow-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900">
                Aperçu des données contenues dans le fichier
              </h3>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-800">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
              Données non enregistrées en base
            </span>
          </div>

          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800">
              Fichier analysé : <span className="font-normal text-slate-700">{preview.filename}</span>
            </p>
            <p>
              Type détecté :{" "}
              <strong className="text-slate-900">
                {preview.type === "bonds"
                  ? "Obligations"
                  : preview.type === "cashflows"
                  ? "Cash-Flows"
                  : "Pricer Master"}
              </strong>{" "}
              ({preview.count} élément(s) valide(s) trouvé(s))
            </p>
          </div>

          {/* Preview Rows Table */}
          {preview.previewRows && preview.previewRows.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    {Object.keys(preview.previewRows[0]).map((key) => (
                      <th key={key} className="px-3 py-2">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {preview.previewRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      {Object.values(row).map((val, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 truncate max-w-[160px]">
                          {val ?? "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.count && preview.count > preview.previewRows.length && (
                <div className="bg-slate-50 px-3 py-1.5 text-[11px] text-slate-500 text-center border-t border-slate-200">
                  + {preview.count - preview.previewRows.length} autre(s) élément(s) conforme(s) dans le fichier.
                </div>
              )}
            </div>
          )}

          {/* Validation Notice & Confirmation Action */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-xs text-slate-600 italic max-w-md">
              💡 Cliquez ci-dessous pour confirmer et enregistrer ces données dans la base de données de la plateforme.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelPreview}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <X className="h-3.5 w-3.5 text-slate-500" />
                Annuler
              </button>
              <button
                type="button"
                onClick={runCommit}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 active:scale-[0.98] transition disabled:opacity-60"
              >
                <Check className="h-4 w-4" />
                {isPending ? "Enregistrement..." : "Valider et enregistrer en base"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
