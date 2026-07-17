import Image from "next/image";
import Link from "next/link";
import { ROLE_LABELS, ROLE_ROUTES } from "@/types/auth";
import { LogoutButton } from "@/components/LogoutButton";
import type { SessionUser } from "@/lib/auth";

export function Nav({ session }: { session: SessionUser | null }) {
  return (
    <header className="border-b border-gray-200 bg-[#f3f3f3]">
      <nav className="mx-auto flex h-24 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-1">
          <Image
            src="/Attijariwafa-Banklogo.png"
            alt="Bond Management logo"
            width={220}
            height={44}
            priority
            className="h-16 w-auto object-contain"
          />
        </Link>

        <div className="flex items-center gap-3">
          {session?.role ? (
            <>
              <span className="hidden text-xs text-gray-500 sm:inline">{session.email}</span>
              <Link
                href={ROLE_ROUTES[session.role]}
                className="text-xs font-medium text-gray-700 transition-colors hover:text-[#f28c28]"
              >
                {ROLE_LABELS[session.role]}
              </Link>
              <LogoutButton />
            </>
          ) : (
            <Link
              href="/auth"
              className="rounded-md border border-[#f28c28] bg-white px-3 py-1.5 text-xs font-medium text-[#f28c28] transition-colors hover:bg-[#f28c28] hover:text-white"
            >
              Se connecter
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
