"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Bond } from "@/types/bond";
import { applyPriceUpdate } from "@/lib/actions/bonds";

interface UpdateDataPanelProps {
  bonds: Bond[];
}

export function UpdateDataPanel({ bonds }: UpdateDataPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string>(bonds[0]?.id ?? "");
  const [price, setPrice] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selected = bonds.find((b) => b.id === selectedId) ?? null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(price);
    if (!selected || !Number.isFinite(value)) return;

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await applyPriceUpdate(selected.id, value, note);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(`Prix de ${selected.name} mis à jour à ${value.toFixed(2)}%.`);
      setPrice("");
      setNote("");
      router.refresh();
    });
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900">Mettre à jour les données</h2>
      <p className="mb-4 text-sm text-gray-500">
        Applique un nouveau prix de marché à une obligation et journalise
        l&apos;opération dans l&apos;historique (UC-03).
      </p>

      <form
        onSubmit={submit}
        className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-5 sm:grid-cols-2"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Obligation</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-[#f28c28] focus:ring-2 focus:ring-[#f28c28]/20"
          >
            {bonds.map((b) => (
              <option key={b.id} value={b.id}>
                {b.isin} — {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Nouveau prix (% du nominal)
          </label>
          <input
            type="number"
            step="0.01"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-[#f28c28] focus:ring-2 focus:ring-[#f28c28]/20"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Note / source
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex : cotation Bloomberg 09h30"
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-[#f28c28] focus:ring-2 focus:ring-[#f28c28]/20"
          />
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 sm:col-span-2">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 sm:col-span-2">
            {success}
          </p>
        )}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={!selected || isPending}
            className="rounded-md bg-[#f28c28] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#e07b12] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Application…" : "Appliquer la mise à jour"}
          </button>
        </div>
      </form>
    </div>
  );
}
