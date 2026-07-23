import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSessionToken, verifySessionToken } from "@/lib/session";
import type { AppRole } from "@/types/auth";

export type SessionUser = {
  id: string;
  email: string;
  role: AppRole;
};

const SESSION_COOKIE = "bond_session";

export async function getCurrentUserWithProfile(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const userId = verifySessionToken(token);
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.active) return null;

  return { id: user.id, email: user.email, role: user.role as AppRole };
}

export async function setSessionUser(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearSessionUser() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** Throws-free guard for use at the top of Server Components / Server Actions. */
export async function requireRole(role: AppRole): Promise<SessionUser | null> {
  const session = await getCurrentUserWithProfile();
  if (!session || session.role !== role) return null;
  return session;
}
