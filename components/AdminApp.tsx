"use client";

import { Users } from "lucide-react";
import type { AppUser } from "@/types/user";
import { DashboardShell } from "@/components/DashboardShell";
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
    <DashboardShell
      area="Administrateur"
      email={email}
      tabs={[{ id: "users", label: "Utilisateurs", icon: Users }]}
      tab="users"
      onTabChange={() => undefined}
    >
      <UsersPanel users={users} currentUserId={currentUserId} />
    </DashboardShell>
  );
}
