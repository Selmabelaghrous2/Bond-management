"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AppUser } from "@/types/user";
import { ROLE_LABELS, type AppRole } from "@/types/auth";
import { Modal } from "@/components/Modal";
import {
  createUser,
  deleteUser,
  resetUserPassword,
  toggleUserActive,
  updateUserRole,
} from "@/lib/actions/users";

const ROLES: AppRole[] = ["admin", "backoffice", "analyste", "systeme"];

export function UsersPanel({ users, currentUserId }: { users: AppUser[]; currentUserId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("backoffice");
  const [error, setError] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createUser({ email, password, role });
      if (result.error) {
        setError(result.error);
        return;
      }
      setShowForm(false);
      setEmail("");
      setPassword("");
      setRole("backoffice");
      router.refresh();
    });
  }

  function changeRole(id: string, newRole: AppRole) {
    startTransition(async () => {
      await updateUserRole(id, newRole);
      router.refresh();
    });
  }

  function toggleActive(id: string, active: boolean) {
    startTransition(async () => {
      const result = await toggleUserActive(id, active);
      if (result.error) alert(result.error);
      router.refresh();
    });
  }

  function submitReset(id: string) {
    startTransition(async () => {
      const result = await resetUserPassword(id, newPassword);
      if (result.error) {
        setError(result.error);
        return;
      }
      setResettingId(null);
      setNewPassword("");
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    startTransition(async () => {
      const result = await deleteUser(id);
      if (result.error) alert(result.error);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Gérer les utilisateurs</h2>
          <p className="text-sm text-gray-500">
            Créez des comptes, attribuez des rôles et gérez les accès à la plateforme.
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm((v) => !v);
            setError(null);
          }}
          className="rounded-md bg-[#f28c28] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#e07b12]"
        >
          + Nouvel utilisateur
        </button>
      </div>

      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setError(null);
        }}
        title="Nouvel utilisateur"
        description="Créez un compte et attribuez-lui un rôle d'accès."
      >
        <form onSubmit={submitCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-black outline-none focus:border-[#f28c28] focus:ring-2 focus:ring-[#f28c28]/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Mot de passe (8+ caractères)
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-[#f28c28] focus:ring-2 focus:ring-[#f28c28]/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Rôle</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AppRole)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-[#f28c28] focus:ring-2 focus:ring-[#f28c28]/20"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 sm:col-span-3">
              {error}
            </p>
          )}

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-[#f28c28] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#e07b12] disabled:opacity-60"
            >
              Créer le compte
            </button>
          </div>
        </form>
      </Modal>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-2.5">Email</th>
              <th className="px-4 py-2.5">Rôle</th>
              <th className="px-4 py-2.5">Statut</th>
              <th className="px-4 py-2.5">Créé le</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-900">
                  {u.email}
                  {u.id === currentUserId && (
                    <span className="ml-2 text-xs text-gray-400">(vous)</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value as AppRole)}
                    className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-black outline-none focus:border-[#f28c28]"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      u.active
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 bg-gray-100 text-gray-500"
                    }`}
                  >
                    {u.active ? "Actif" : "Désactivé"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-gray-500">
                  {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right text-xs">
                  <button
                    onClick={() => setResettingId(resettingId === u.id ? null : u.id)}
                    className="mr-3 font-medium text-[#f28c28] hover:underline"
                  >
                    Mot de passe
                  </button>
                  <button
                    onClick={() => toggleActive(u.id, !u.active)}
                    disabled={u.id === currentUserId}
                    className="mr-3 font-medium text-gray-600 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {u.active ? "Désactiver" : "Réactiver"}
                  </button>
                  <button
                    onClick={() => remove(u.id)}
                    disabled={u.id === currentUserId}
                    className="font-medium text-red-500 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Supprimer
                  </button>
                  {resettingId === u.id && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="password"
                        placeholder="Nouveau mot de passe"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs outline-none focus:border-[#f28c28]"
                      />
                      <button
                        onClick={() => submitReset(u.id)}
                        className="rounded-md bg-[#f28c28] px-2 py-1 text-xs font-medium text-white hover:bg-[#e07b12]"
                      >
                        Valider
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
