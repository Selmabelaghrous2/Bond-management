import type { BondStatus } from "@/types/bond";

const STYLES: Record<BondStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  suspended: "bg-amber-50 text-amber-700 border-amber-200",
  matured: "bg-gray-100 text-gray-500 border-gray-200",
};

const LABELS: Record<BondStatus, string> = {
  active: "Active",
  suspended: "Suspendue",
  matured: "Échue",
};

export function StatusBadge({ status }: { status: BondStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
