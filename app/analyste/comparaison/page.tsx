import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserWithProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeBond } from "@/lib/serializers";

export const dynamic = "force-dynamic";

type SearchParams = {
  ids?: string | string[];
};

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function formatPercent(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value.toFixed(3)}%`;
}

export default async function BondComparisonPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const session = await getCurrentUserWithProfile();
  if (!session || session.role !== "analyste") redirect("/auth?next=/analyste/comparaison");
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const ids = firstValue(resolvedSearchParams?.ids)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 3);

  const bonds = ids.length
    ? await prisma.bond.findMany({
        where: { id: { in: ids } },
      })
    : [];

  const ordered = ids
    .map((id) => bonds.find((bond) => bond.id === id))
    .filter((bond): bond is NonNullable<typeof bond> => Boolean(bond))
    .map(serializeBond);

  const missingCount = ids.length - ordered.length;

  const rows = [
    { label: "ISIN", render: (bond: (typeof ordered)[number]) => bond.isin },
    { label: "Nom", render: (bond: (typeof ordered)[number]) => bond.name },
    { label: "Nominal", render: (bond: (typeof ordered)[number]) => `${bond.nominal.toLocaleString("fr-FR")} MAD` },
    { label: "Coupon", render: (bond: (typeof ordered)[number]) => formatPercent(bond.couponRate) },
    { label: "Echeance", render: (bond: (typeof ordered)[number]) => bond.maturityDate },
    { label: "Frequence", render: (bond: (typeof ordered)[number]) => `${bond.frequency} / an` },
    { label: "Prix marche", render: (bond: (typeof ordered)[number]) => formatPercent(bond.price) },
    {
      label: "Rendement indicatif",
      render: (bond: (typeof ordered)[number]) => (bond.price ? `${(bond.couponRate / bond.price * 100).toFixed(2)}%` : "—"),
    },
    { label: "Type", render: (bond: (typeof ordered)[number]) => (bond.isFloating ? "Revisable" : "Fixe") },
    { label: "Amortissant", render: (bond: (typeof ordered)[number]) => (bond.isAmortizing ? "Oui" : "Non") },
    { label: "Date d emission", render: (bond: (typeof ordered)[number]) => bond.issueDate },
    { label: "Date de valeur", render: (bond: (typeof ordered)[number]) => bond.valueDate ?? "—" },
    { label: "Type de valeur", render: (bond: (typeof ordered)[number]) => bond.valueType ?? "—" },
    { label: "Schedule", render: (bond: (typeof ordered)[number]) => bond.schedule ?? "—" },
    { label: "Commentaires", render: (bond: (typeof ordered)[number]) => bond.comments ?? "—" },
  ] as const;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f28c28]">Analyste financier</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Comparaison cote a cote des obligations</h1>
            <p className="mt-1 text-sm text-slate-500">
              {ordered.length > 0 ? `${ordered.length} obligation(s) chargee(s)` : "Aucune obligation selectionnee"}
            </p>
          </div>
          <Link
            href="/analyste"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
          >
            Retour a l analyste
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {missingCount > 0 && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {missingCount} identifiant(s) n ont pas ete trouves dans le referentiel.
          </div>
        )}

        {ordered.length < 2 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-sm text-slate-600">
            Selectionnez au moins deux obligations dans la section <Link href="/analyste" className="font-medium text-[#f28c28] underline">Obligations</Link> puis relancez la comparaison.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Criteres
                    </th>
                    {ordered.map((bond) => (
                      <th key={bond.id} className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left align-top">
                        <p className="font-mono text-xs text-slate-500">{bond.isin}</p>
                        <p className="mt-1 text-base font-semibold text-slate-900">{bond.name}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.label} className="align-top">
                      <th className="sticky left-0 z-10 border-b border-slate-100 bg-white px-4 py-3 text-left font-medium text-slate-600">
                        {row.label}
                      </th>
                      {ordered.map((bond) => (
                        <td key={`${row.label}-${bond.id}`} className="border-b border-slate-100 px-4 py-3 text-slate-900">
                          {row.render(bond)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
