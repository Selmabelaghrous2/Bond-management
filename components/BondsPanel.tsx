"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Bond, BondStatus } from "@/types/bond";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import { createBond, deleteBond, updateBond } from "@/lib/actions/bonds";

interface BondsPanelProps {
  bonds: Bond[];
}

type DraftBond = Omit<
  Bond,
  "price" | "valueDate" | "valueType" | "isFloating" | "isAmortizing" | "schedule" | "comments" | "wgRate" | "ctRate" | "cfgRate"
>;

const EMPTY_DRAFT: DraftBond = {
  id: "",
  isin: "",
  internalCode: "",
  name: "",
  nominal: 100000,
  couponRate: 4,
  frequency: 2,
  issueDate: "",
  enjoymentDate: "",
  maturityDate: "",
  revisionDate: "",
  rateType: "Fixe",
  revisionPeriod: "",
  repaymentPeriod: "",
  amortizationType: "In fine",
  couponPeriod: "Semestrielle",
  status: "active",
};

export function BondsPanel({ bonds }: BondsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftBond>(EMPTY_DRAFT);
  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState<Bond | null>(null);
  const [error, setError] = useState<string | null>(null);

  function startCreate() {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setShowForm(true);
    setError(null);
  }

  function startEdit(bond: Bond) {
    const { price: _price, ...rest } = bond;
    void _price;
    setDraft(rest);
    setEditingId(bond.id);
    setShowForm(true);
    setError(null);
  }

  function cancel() {
    setShowForm(false);
    setEditingId(null);
    setError(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.isin || !draft.name || !draft.issueDate || !draft.maturityDate) return;

    startTransition(async () => {
      const result = editingId
        ? await updateBond(editingId, draft)
        : await createBond(draft);

      if (result.error) {
        setError(result.error);
        return;
      }
      setShowForm(false);
      setEditingId(null);
      router.refresh();
    });
  }

  function remove(bond: Bond) {
    if (!confirm(`Supprimer définitivement l'obligation ${bond.isin} ?`)) return;
    startTransition(async () => {
      const result = await deleteBond(bond.id);
      if (result.error) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Gérer les obligations</h2>
          <p className="text-sm text-black">
            Créez, modifiez ou retirez des lignes obligataires du référentiel.
          </p>
        </div>
        <button
          onClick={startCreate}
          className="rounded-md bg-[#f28c28] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#e07b12]"
        >
          + Nouvelle obligation
        </button>
      </div>

      <Modal
        open={showForm}
        onClose={cancel}
        title={editingId ? "Modifier l'obligation" : "Nouvelle obligation"}
        description="Renseignez les caractéristiques de la ligne obligataire."
      >
        <form onSubmit={submit} className="bond-crud-form grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-black">ISIN</label>
            <input
              required
              value={draft.isin}
              onChange={(e) => setDraft({ ...draft, isin: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-black outline-none focus:border-[#f28c28] focus:ring-2 focus:ring-[#f28c28]/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-black">Code interne</label>
            <input value={draft.internalCode ?? ""} onChange={(e) => setDraft({ ...draft, internalCode: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-black outline-none focus:border-[#f28c28] focus:ring-2 focus:ring-[#f28c28]/20" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Désignation</label>
            <input
              required
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-[#f28c28] focus:ring-2 focus:ring-[#f28c28]/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Nominal (MAD)
            </label>
            <input
              type="number"
              min={0}
              required
              value={draft.nominal}
              onChange={(e) => setDraft({ ...draft, nominal: Number(e.target.value) })}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-[#f28c28] focus:ring-2 focus:ring-[#f28c28]/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Taux facial (%)
            </label>
            <input
              type="number"
              step="0.01"
              min={0}
              required
              value={draft.couponRate}
              onChange={(e) => setDraft({ ...draft, couponRate: Number(e.target.value) })}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-[#f28c28] focus:ring-2 focus:ring-[#f28c28]/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Fréquence coupon
            </label>
            <select
              value={draft.frequency}
              onChange={(e) =>
                setDraft({ ...draft, frequency: Number(e.target.value) as Bond["frequency"] })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-[#f28c28] focus:ring-2 focus:ring-[#f28c28]/20"
            >
              <option value={1}>Annuelle</option>
              <option value={2}>Semestrielle</option>
              <option value={4}>Trimestrielle</option>
              <option value={12}>Mensuelle</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Type taux</label>
            <select value={draft.rateType ?? ""} onChange={(e) => setDraft({ ...draft, rateType: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-[#f28c28] focus:ring-2 focus:ring-[#f28c28]/20"><option value="Fixe">Fixe</option><option value="Variable">Variable</option><option value="Révisable">Révisable</option></select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Période révision</label>
            <input placeholder="Ex. 6 mois" value={draft.revisionPeriod ?? ""} onChange={(e) => setDraft({ ...draft, revisionPeriod: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-[#f28c28] focus:ring-2 focus:ring-[#f28c28]/20" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Période remboursement</label>
            <input placeholder="Ex. À l'échéance" value={draft.repaymentPeriod ?? ""} onChange={(e) => setDraft({ ...draft, repaymentPeriod: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-[#f28c28] focus:ring-2 focus:ring-[#f28c28]/20" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Type amortissement</label>
            <select value={draft.amortizationType ?? ""} onChange={(e) => setDraft({ ...draft, amortizationType: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-[#f28c28] focus:ring-2 focus:ring-[#f28c28]/20"><option value="In fine">In fine</option><option value="Amortissable">Amortissable</option></select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Période CP</label>
            <select value={draft.couponPeriod ?? ""} onChange={(e) => setDraft({ ...draft, couponPeriod: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-[#f28c28] focus:ring-2 focus:ring-[#f28c28]/20"><option value="Mensuelle">Mensuelle</option><option value="Trimestrielle">Trimestrielle</option><option value="Semestrielle">Semestrielle</option><option value="Annuelle">Annuelle</option></select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Statut</label>
            <select
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value as BondStatus })}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-[#f28c28] focus:ring-2 focus:ring-[#f28c28]/20"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspendue</option>
              <option value="matured">Échue</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Date d&apos;émission
            </label>
            <input
              type="date"
              required
              value={draft.issueDate}
              onChange={(e) => setDraft({ ...draft, issueDate: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-[#f28c28] focus:ring-2 focus:ring-[#f28c28]/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Date d&apos;échéance
            </label>
            <input
              type="date"
              required
              value={draft.maturityDate}
              onChange={(e) => setDraft({ ...draft, maturityDate: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-[#f28c28] focus:ring-2 focus:ring-[#f28c28]/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Date de jouissance</label>
            <input type="date" value={draft.enjoymentDate ?? ""} onChange={(e) => setDraft({ ...draft, enjoymentDate: e.target.value || null })} className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-[#f28c28] focus:ring-2 focus:ring-[#f28c28]/20" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Date de révision</label>
            <input type="date" value={draft.revisionDate ?? ""} onChange={(e) => setDraft({ ...draft, revisionDate: e.target.value || null })} className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-[#f28c28] focus:ring-2 focus:ring-[#f28c28]/20" />
          </div>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 sm:col-span-2">
              {error}
            </p>
          )}

          <div className="flex items-center gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-[#f28c28] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#e07b12] disabled:opacity-60"
            >
              {editingId ? "Enregistrer les modifications" : "Créer l'obligation"}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Annuler
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={detail !== null} onClose={() => setDetail(null)} title="Fiche de l'obligation" description="Consultez les caractéristiques administratives et financières du titre.">
        {detail && <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <Detail label="ISIN" value={detail.isin} mono /><Detail label="Code interne" value={detail.internalCode || "Non renseigné"} />
          <Detail label="Désignation" value={detail.name} />
          <Detail label="Nominal" value={`${detail.nominal.toLocaleString("fr-FR")} MAD`} /><Detail label="Taux facial" value={`${detail.couponRate.toFixed(3)} %`} />
          <Detail label="Type taux" value={detail.rateType || "Non renseigné"} /><Detail label="Période CP" value={detail.couponPeriod || `${detail.frequency} paiement(s) / an`} />
          <Detail label="Période révision" value={detail.revisionPeriod || "Non renseignée"} /><Detail label="Période remboursement" value={detail.repaymentPeriod || "Non renseignée"} />
          <Detail label="Type amortissement" value={detail.amortizationType || "Non renseigné"} /><Detail label="Date d'émission" value={detail.issueDate} />
          <Detail label="Date de jouissance" value={detail.enjoymentDate || "Non renseignée"} /><Detail label="Date de révision" value={detail.revisionDate || "Non renseignée"} />
          <Detail label="Date d'échéance" value={detail.maturityDate} /><Detail label="Prix de marché" value={detail.price == null ? "Non renseigné" : `${detail.price.toFixed(3)} %`} />
          <Detail label="Statut" value={detail.status === "matured" ? "Archivée / échue" : detail.status === "suspended" ? "Suspendue" : "Active"} />
        </dl>}
      </Modal>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm text-black">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-black">
            <tr>
              <th className="px-4 py-2.5">ISIN</th>
              <th className="px-4 py-2.5">Code interne</th>
              <th className="px-4 py-2.5">Désignation</th>
              <th className="px-4 py-2.5">Date émission</th>
              <th className="px-4 py-2.5">Date jouissance</th>
              <th className="px-4 py-2.5">Maturité</th>
              <th className="px-4 py-2.5">Date révision</th>
              <th className="px-4 py-2.5">Type taux</th>
              <th className="px-4 py-2.5">Période révision</th>
              <th className="px-4 py-2.5">Période remb.</th>
              <th className="px-4 py-2.5">Type amort.</th>
              <th className="px-4 py-2.5">Période CP</th>
              <th className="px-4 py-2.5">Nominal</th>
              <th className="px-4 py-2.5">Coupon</th>
              <th className="px-4 py-2.5">Prix</th>
              <th className="px-4 py-2.5">Statut</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bonds.length === 0 && (
              <tr>
                <td colSpan={17} className="px-4 py-6 text-center text-gray-400">
                  Aucune obligation. Créez-en une pour commencer.
                </td>
              </tr>
            )}
            {bonds.map((bond) => (
              <tr key={bond.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-black">
                  {bond.isin}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-black">{bond.internalCode ?? "—"}</td>
                <td className="px-4 py-2.5 font-medium text-black">{bond.name}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-black">{bond.issueDate}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-black">{bond.enjoymentDate ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-black">{bond.maturityDate}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-black">{bond.revisionDate ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-black">{bond.rateType ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-black">{bond.revisionPeriod ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-black">{bond.repaymentPeriod ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-black">{bond.amortizationType ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-black">{bond.couponPeriod ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-black">
                  {bond.nominal.toLocaleString("fr-FR")} MAD
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-black">
                  {bond.couponRate.toFixed(2)}%
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-black">
                  {bond.price != null ? `${bond.price.toFixed(2)}%` : "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <StatusBadge status={bond.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right">
                  <button
                    onClick={() => startEdit(bond)}
                    className="mr-3 text-xs font-medium text-[#f28c28] hover:underline"
                  >
                    Modifier
                  </button>
                  <button onClick={() => remove(bond)} disabled={isPending} className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</dt><dd className={`mt-1 text-gray-900 ${mono ? "font-mono" : ""}`}>{value}</dd></div>;
}
