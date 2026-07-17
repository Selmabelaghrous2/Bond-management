"use client";

import { signOut } from "@/app/auth/actions";

export function LogoutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-md border border-[#f28c28] bg-white px-3 py-1.5 text-xs font-medium text-[#f28c28] transition-colors hover:bg-[#f28c28] hover:text-white"
      >
        Déconnexion
      </button>
    </form>
  );
}
