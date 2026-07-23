import Image from "next/image";
import Link from "next/link";
import { ROLE_LABELS, ROLE_ROUTES } from "@/types/auth";
import { LogoutButton } from "@/components/LogoutButton";
import type { SessionUser } from "@/lib/auth";

export function Nav({ session }: { session: SessionUser | null }) {
  return (
    <header className="border-b border-gray-200 bg-[#f0eff1]">
      <nav className="mx-auto flex h-27 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-1">
          <Image
            src="/Attijariwafa-Banklogo.png"
            alt="Bond Management logo"
            width={600}
            height={80}
            priority
            className="h-[8.8rem] w-auto object-contain"
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
          ) : null}
        </div>
      </nav>
    </header>
  );
}
