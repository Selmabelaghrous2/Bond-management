import type { AppUser } from "@/types/user";
import { UsersPanel } from "@/components/UsersPanel";

export function AdminApp({
  email,
  users,
  currentUserId,
}: {
  email: string;
  users: AppUser[];
  currentUserId: string;
}) {
  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-6 py-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold text-gray-900">Espace Administrateur</h1>
          <p className="text-sm text-gray-500">Connecté en tant que {email}</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <UsersPanel users={users} currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
}
