"use client";

import { useState } from "react";
import {
  Activity,
  Check,
  ChevronDown,
  Database,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Settings,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { AppUser } from "@/types/user";
import type { HistoryEntry } from "@/types/bond";
import { DashboardShell } from "@/components/DashboardShell";
import { UsersPanel } from "@/components/UsersPanel";
import { HistoryPanel } from "@/components/HistoryPanel";
import { Modal } from "@/components/Modal";

type AdminTab = "users" | "settings" | "references" | "activity";

const TABS = [
  { id: "users", label: "Gérer les utilisateurs", icon: Users },
  { id: "settings", label: "Paramétrer l’application", icon: Settings },
  { id: "references", label: "Gérer les référentiels", icon: Database },
  { id: "activity", label: "Journaux d’activité", icon: Activity },
] as const;

export function AdminApp({ email, users, currentUserId, history }: {
  email: string;
  users: AppUser[];
  currentUserId: string;
  history: HistoryEntry[];
}) {
  const [tab, setTab] = useState<AdminTab>("users");

  return (
    <DashboardShell area="Administrateur" email={email} tabs={TABS} tab={tab} onTabChange={setTab}>
      {tab === "users" && <UsersPanel users={users} currentUserId={currentUserId} />}
      {tab === "settings" && <SettingsPanel />}
      {tab === "references" && <ReferencesPanel />}
      {tab === "activity" && <HistoryPanel entries={history} />}
    </DashboardShell>
  );
}

type SettingSection = "market" | "notifications" | "security" | "reports";

const SETTING_SECTIONS: { id: SettingSection; title: string; description: string }[] = [
  { id: "market", title: "Données du marché", description: "Source et fréquence de mise à jour des courbes et des prix." },
  { id: "notifications", title: "Notifications", description: "Alertes liées aux échéances et aux opérations sensibles." },
  { id: "security", title: "Sécurité", description: "Règles de mot de passe, sessions et contrôle des accès." },
  { id: "reports", title: "Rapports", description: "Modèles, fréquence et destinataires des rapports opérationnels." },
];

function SettingsPanel() {
  const [open, setOpen] = useState<SettingSection | null>("market");

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Paramétrer l’application</h2>
        <p className="mt-1 text-sm text-gray-500">Configurez les paramètres fonctionnels de la plateforme.</p>
      </div>
      <div className="space-y-3">
        {SETTING_SECTIONS.map((section) => {
          const isOpen = open === section.id;
          return (
            <div key={section.id} className="rounded-lg border border-slate-200 bg-white">
              <button type="button" onClick={() => setOpen(isOpen ? null : section.id)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50">
                <span><span className="block font-semibold text-slate-900">{section.title}</span><span className="mt-1 block text-sm text-slate-500">{section.description}</span></span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && <SettingForm section={section.id} />}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SettingForm({ section }: { section: SettingSection }) {
  if (section === "notifications") return <NotificationSettings />;

  const fields: Record<SettingSection, { label: string; type?: string; value: string; options?: string[] }[]> = {
    market: [
      { label: "Source des données", value: "Banque centrale / fournisseur de marché" },
      { label: "Fréquence de synchronisation", value: "Toutes les 15 minutes" },
      { label: "Méthode de récupération", value: "API", options: ["API", "Import Excel", "Manuel"] },
      { label: "Devise par défaut", value: "MAD", options: ["MAD", "EUR", "USD"] },
    ],
    notifications: [
      { label: "Adresse de réception", type: "email", value: "back-office@attijariwafa.com" },
      { label: "Délai d’alerte avant échéance", value: "30 jours" },
    ],
    security: [
      { label: "Durée maximale de session", value: "30 minutes" },
      { label: "Expiration du mot de passe", value: "90 jours" },
    ],
    reports: [
      { label: "Format par défaut", value: "PDF" },
      { label: "Envoi automatique", value: "Chaque lundi à 08:00" },
    ],
  };

  return (
    <div className="border-t border-slate-200 bg-slate-50 px-5 py-5">
      <div className="grid gap-4 md:grid-cols-2">
        {fields[section].map((field) => <label key={field.label} className="text-sm font-medium text-slate-700">{field.label}{field.options ? <select defaultValue={field.value} className="mt-1.5 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-[#f28c28] focus:ring-1 focus:ring-[#f28c28]">{field.options.map((option) => <option key={option}>{option}</option>)}</select> : <input type={field.type ?? "text"} defaultValue={field.value} className="mt-1.5 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-[#f28c28] focus:ring-1 focus:ring-[#f28c28]" />}</label>)}
      </div>
      <button type="button" onClick={() => alert("Paramètres enregistrés.")} className="mt-5 rounded-md bg-[#f28c28] px-4 py-2 text-sm font-semibold text-white hover:bg-[#dc7819]">Enregistrer les paramètres</button>
    </div>
  );
}

type NotificationRole = "admin" | "analyst" | "backOffice" | "external";
type NotificationValue = any;
type NotificationRule = { event: string } & Record<NotificationRole, NotificationValue>;

const NOTIFICATION_ROLES: { id: NotificationRole; label: string }[] = [
  { id: "admin", label: "Admin" },
  { id: "analyst", label: "Analyste financier" },
  { id: "backOffice", label: "Back Office" },
  { id: "external", label: "Système externe" },
];

const NOTIFICATION_RULES: NotificationRule[] = [
  { event: "Nouvelle obligation créée", admin: true, analyst: true, backOffice: true, external: false },
  { event: "Obligation modifiée", admin: true, analyst: true, backOffice: true, external: false },
  { event: "Obligation supprimée", admin: true, analyst: true, backOffice: true, external: false },
  { event: "Obligation validée", admin: true, analyst: true, backOffice: true, external: true },
  { event: "Nouvelle émission d’obligations", admin: true, analyst: true, backOffice: true, external: true },
  { event: "Obligation arrive à échéance", admin: true, analyst: true, backOffice: true, external: true },
  { event: "Paiement de coupon à effectuer", admin: false, analyst: true, backOffice: true, external: true },
  { event: "Cash Flows générés", admin: false, analyst: true, backOffice: true, external: false },
  { event: "Pricing terminé", admin: false, analyst: true, backOffice: false, external: false },
  { event: "Erreur de calcul du prix", admin: true, analyst: true, backOffice: false, external: false },
  { event: "Courbe Zero Coupon mise à jour", admin: false, analyst: true, backOffice: false, external: false },
  { event: "Import Excel réussi", admin: true, analyst: true, backOffice: false, external: false },
  { event: "Import Excel échoué", admin: true, analyst: true, backOffice: false, external: false },
  { event: "Export PDF/Excel terminé", admin: false, analyst: true, backOffice: true, external: false },
  { event: "Synchronisation avec un système externe réussie", admin: true, analyst: false, backOffice: true, external: true },
  { event: "Synchronisation échouée", admin: true, analyst: false, backOffice: true, external: true },
  { event: "Connexion suspecte", admin: true, analyst: false, backOffice: false, external: false },
  { event: "Nouvel utilisateur créé", admin: true, analyst: false, backOffice: false, external: false },
  { event: "Changement de rôle utilisateur", admin: true, analyst: false, backOffice: false, external: false },
  { event: "Sauvegarde de la base terminée", admin: true, analyst: false, backOffice: false, external: false },
  { event: "Erreur système critique", admin: true, analyst: false, backOffice: false, external: false },
];

function NotificationSettings() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => Object.fromEntries(NOTIFICATION_RULES.map((rule) => [rule.event, true])));

  return <div className="border-t border-slate-200 bg-slate-50 px-5 py-5"><p className="mb-4 text-sm text-slate-600">Activez ou désactivez les notifications de la plateforme par événement.</p><div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">{NOTIFICATION_RULES.map((rule) => <label key={rule.event} className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50"><span className="text-sm text-slate-700">{rule.event}</span><span className="flex shrink-0 items-center gap-2"><span className={`text-xs font-medium ${enabled[rule.event] ? "text-emerald-600" : "text-slate-400"}`}>{enabled[rule.event] ? "Activée" : "Désactivée"}</span><input type="checkbox" checked={enabled[rule.event]} onChange={() => setEnabled((current) => ({ ...current, [rule.event]: !current[rule.event] }))} aria-label={`${rule.event} - ${enabled[rule.event] ? "désactiver" : "activer"}`} className="h-4 w-4 accent-[#f28c28]" /></span></label>)}</div><button type="button" onClick={() => alert("Paramètres enregistrés.")} className="mt-5 rounded-md bg-[#f28c28] px-4 py-2 text-sm font-semibold text-white hover:bg-[#dc7819]">Enregistrer les paramètres</button></div>;

  const [rules, setRules] = useState(NOTIFICATION_RULES);
  const toggle = (rowIndex: number, role: NotificationRole) => setRules((current) => current.map((rule, index) => index === rowIndex && rule[role] !== "concerned" ? { ...rule, [role]: !rule[role] } : rule));

  return <div className="border-t border-slate-200 bg-slate-50 px-5 py-5"><p className="mb-4 text-sm text-slate-600">Activez ou désactivez les notifications de la plateforme par événement et par profil.</p><div className="overflow-x-auto rounded-lg border border-slate-200 bg-white"><table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"><tr><th className="px-3 py-3">Événement</th>{NOTIFICATION_ROLES.map((role) => <th key={role.id} className="px-3 py-3 text-center">{role.label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rules.map((rule, rowIndex) => <tr key={rule.event}><td className="px-3 py-2.5 text-slate-700">{rule.event}</td>{NOTIFICATION_ROLES.map((role) => <td key={role.id} className="px-3 py-2.5 text-center">{rule[role.id] === "concerned" ? <span className="text-xs text-slate-500">Utilisateur concerné</span> : <input type="checkbox" checked={rule[role.id]} onChange={() => toggle(rowIndex, role.id)} aria-label={`${rule.event} - ${role.label}`} className="h-4 w-4 accent-[#f28c28]" />}</td>)}</tr>)}</tbody></table></div><button type="button" onClick={() => alert("Paramètres enregistrés.")} className="mt-5 rounded-md bg-[#f28c28] px-4 py-2 text-sm font-semibold text-white hover:bg-[#dc7819]">Enregistrer les paramètres</button></div>;
}

type ReferenceStatus = "Actif" | "Brouillon";
type ReferenceItem = { id: number; label: string; code: string; status: ReferenceStatus };
type Reference = { id: string; name: string; description: string; items: ReferenceItem[] };

const REFERENCE_SEED: Reference[] = [
  { id: "rate-types", name: "Types de taux", description: "Valeurs utilisées pour qualifier le taux facial d’une obligation.", items: [
    { id: 1, label: "Fixe", code: "FIXE", status: "Actif" }, { id: 2, label: "Variable", code: "VARIABLE", status: "Actif" }, { id: 3, label: "Révisable", code: "REVISABLE", status: "Actif" },
  ]},
  { id: "frequencies", name: "Fréquences de coupon", description: "Périodicité des paiements de coupons.", items: [
    { id: 4, label: "Annuelle", code: "1", status: "Actif" }, { id: 5, label: "Semestrielle", code: "2", status: "Actif" }, { id: 6, label: "Trimestrielle", code: "4", status: "Actif" }, { id: 7, label: "Mensuelle", code: "12", status: "Actif" },
  ]},
  { id: "bond-statuses", name: "Statuts d’obligation", description: "Cycle de vie opérationnel des lignes obligataires.", items: [
    { id: 8, label: "Active", code: "ACTIVE", status: "Actif" }, { id: 9, label: "Suspendue", code: "SUSPENDED", status: "Actif" }, { id: 10, label: "Échue", code: "MATURED", status: "Actif" },
  ]},
  { id: "amortization", name: "Types d’amortissement", description: "Modalités de remboursement du principal.", items: [
    { id: 11, label: "In fine", code: "IN_FINE", status: "Actif" }, { id: 12, label: "Amortissable", code: "AMORTIZABLE", status: "Actif" },
  ]},
  { id: "coupon-periods", name: "Périodes de coupon", description: "Périodes affichées dans les fiches et les échéanciers.", items: [
    { id: 13, label: "Annuelle", code: "ANNUELLE", status: "Actif" }, { id: 14, label: "Semestrielle", code: "SEMESTRIELLE", status: "Actif" }, { id: 15, label: "Trimestrielle", code: "TRIMESTRIELLE", status: "Actif" }, { id: 16, label: "Mensuelle", code: "MENSUELLE", status: "Actif" },
  ]},
  { id: "curves", name: "Courbes de taux", description: "Référentiels de marché utilisés pour les calculs et valorisations.", items: [
    { id: 17, label: "Courbe zéro coupon", code: "ZC", status: "Actif" }, { id: 18, label: "Courbe de marché", code: "MARKET", status: "Actif" },
  ]},
  { id: "revision-periods", name: "Périodes de révision", description: "Périodicités de révision des taux révisables.", items: [
    { id: 19, label: "3 mois", code: "3M", status: "Actif" }, { id: 20, label: "6 mois", code: "6M", status: "Actif" }, { id: 21, label: "12 mois", code: "12M", status: "Actif" },
  ]},
  { id: "repayment-periods", name: "Périodes de remboursement", description: "Modalités de remboursement du principal.", items: [
    { id: 22, label: "À l’échéance", code: "MATURITY", status: "Actif" }, { id: 23, label: "Amortissement périodique", code: "PERIODIC", status: "Actif" },
  ]},
];

function ReferencesPanel() {
  const [references, setReferences] = useState<Reference[]>(REFERENCE_SEED);
  const [openReferenceId, setOpenReferenceId] = useState<string | null>(REFERENCE_SEED[0]?.id ?? null);
  const [selected, setSelected] = useState<Reference | null>(null);
  const [editing, setEditing] = useState<{ referenceId: string; item?: ReferenceItem } | null>(null);
  const [draft, setDraft] = useState({ label: "", code: "" });

  function openCreate(reference: Reference) { setSelected(reference); setEditing({ referenceId: reference.id }); setDraft({ label: "", code: "" }); }
  function openEdit(reference: Reference, item: ReferenceItem) { setSelected(reference); setEditing({ referenceId: reference.id, item }); setDraft({ label: item.label, code: item.code }); }
  function saveItem(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !draft.label.trim() || !draft.code.trim()) return;
    setReferences((all) => all.map((reference) => reference.id !== selected.id ? reference : {
      ...reference,
      items: editing?.item ? reference.items.map((item) => item.id === editing.item?.id ? { ...item, label: draft.label.trim(), code: draft.code.trim() } : item) : [...reference.items, { id: Date.now(), label: draft.label.trim(), code: draft.code.trim().toUpperCase(), status: "Brouillon" }],
    }));
    setEditing(null);
  }
  function removeItem(referenceId: string, itemId: number) {
    setReferences((all) => all.map((reference) => reference.id === referenceId ? { ...reference, items: reference.items.filter((item) => item.id !== itemId) } : reference));
  }
  function toggleItem(referenceId: string, itemId: number) {
    setReferences((all) => all.map((reference) => reference.id === referenceId ? { ...reference, items: reference.items.map((item) => item.id === itemId ? { ...item, status: item.status === "Actif" ? "Brouillon" : "Actif" } : item) } : reference));
  }

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-gray-900">Gerer les referentiels</h2><p className="mt-1 text-sm text-gray-500">Administrez les valeurs utilisateur par les obligations, les echeanciers et les calculs de valorisation.</p></div>
      </div>
      <div className="space-y-3">
        {references.map((reference) => {
          const isOpen = openReferenceId === reference.id;
          const panelId = `reference-panel-${reference.id}`;

          return (
            <div key={reference.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <button type="button" onClick={() => setOpenReferenceId(isOpen ? null : reference.id)} aria-expanded={isOpen} aria-controls={panelId} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50">
                <span className="min-w-0"><span className="block font-semibold text-slate-900">{reference.name}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{reference.description}</span></span>
                <span className="flex shrink-0 items-center gap-3"><span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">{reference.items.filter((item) => item.status === "Actif").length} actif(s)</span><ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} /></span>
              </button>
              {isOpen && <div id={panelId} className="border-t border-slate-200 px-5 py-5"><div className="divide-y divide-slate-100 rounded-lg border border-slate-100">{reference.items.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2.5"><div className="min-w-0"><p className={`truncate text-sm ${item.status === "Actif" ? "text-slate-800" : "text-slate-400 line-through"}`}>{item.label}</p><p className="font-mono text-[10px] text-slate-400">{item.code}</p></div><div className="flex shrink-0 items-center gap-2"><button type="button" title={item.status === "Actif" ? "DÃ©sactiver" : "Activer"} onClick={() => toggleItem(reference.id, item.id)} className="text-slate-400 hover:text-emerald-600">{item.status === "Actif" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button><button type="button" title="Modifier" onClick={() => openEdit(reference, item)} className="text-slate-400 hover:text-slate-700"><Pencil className="h-4 w-4" /></button><button type="button" title="Supprimer" onClick={() => removeItem(reference.id, item.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></div></div>)}</div><button type="button" onClick={() => openCreate(reference)} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#d97706] hover:underline"><Plus className="h-3.5 w-3.5" />Ajouter une valeur</button></div>}
            </div>
          );
        })}
      </div>
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing?.item ? "Modifier la valeur" : "Ajouter une valeur"} description={selected?.name}>
        <form onSubmit={saveItem} className="space-y-4"><label className="block text-sm font-medium text-slate-700">libelle<input required value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#f28c28] focus:ring-1 focus:ring-[#f28c28]" /></label><label className="block text-sm font-medium text-slate-700">Code fonctionnel<input required value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 outline-none focus:border-[#f28c28] focus:ring-1 focus:ring-[#f28c28]" /></label><div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setEditing(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Annuler</button><button type="submit" className="rounded-md bg-[#f28c28] px-4 py-2 text-sm font-semibold text-white">{editing?.item ? "Enregistrer" : "CrÃ©er"}</button></div></form>
      </Modal>
    </section>
  );

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-gray-900">Gérer les référentiels</h2><p className="mt-1 text-sm text-gray-500">Administrez les valeurs utilisées par les obligations, les échéanciers et les calculs de valorisation.</p></div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {references.map((reference) => <div key={reference.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{reference.name}</p><p className="mt-1 text-xs leading-5 text-slate-500">{reference.description}</p></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">{reference.items.filter((item) => item.status === "Actif").length} actif(s)</span></div><div className="divide-y divide-slate-100 rounded-lg border border-slate-100">{reference.items.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2.5"><div className="min-w-0"><p className={`truncate text-sm ${item.status === "Actif" ? "text-slate-800" : "text-slate-400 line-through"}`}>{item.label}</p><p className="font-mono text-[10px] text-slate-400">{item.code}</p></div><div className="flex shrink-0 items-center gap-2"><button type="button" title={item.status === "Actif" ? "Désactiver" : "Activer"} onClick={() => toggleItem(reference.id, item.id)} className="text-slate-400 hover:text-emerald-600">{item.status === "Actif" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button><button type="button" title="Modifier" onClick={() => openEdit(reference, item)} className="text-slate-400 hover:text-slate-700"><Pencil className="h-4 w-4" /></button><button type="button" title="Supprimer" onClick={() => removeItem(reference.id, item.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></div></div>)}</div><button type="button" onClick={() => openCreate(reference)} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#d97706] hover:underline"><Plus className="h-3.5 w-3.5" />Ajouter une valeur</button></div>)}
      </div>
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing?.item ? "Modifier la valeur" : "Ajouter une valeur"} description={selected?.name}>
        <form onSubmit={saveItem} className="space-y-4"><label className="block text-sm font-medium text-slate-700">Libellé<input required value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#f28c28] focus:ring-1 focus:ring-[#f28c28]" /></label><label className="block text-sm font-medium text-slate-700">Code fonctionnel<input required value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 outline-none focus:border-[#f28c28] focus:ring-1 focus:ring-[#f28c28]" /></label><div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setEditing(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Annuler</button><button type="submit" className="rounded-md bg-[#f28c28] px-4 py-2 text-sm font-semibold text-white">{editing?.item ? "Enregistrer" : "Créer"}</button></div></form>
      </Modal>
    </section>
  );
}
