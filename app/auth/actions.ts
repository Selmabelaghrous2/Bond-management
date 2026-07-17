"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { clearSessionUser, setSessionUser } from "@/lib/auth";
import { ROLE_ROUTES, type AppRole } from "@/types/auth";

export type LoginState = {
  error: string | null;
};

export async function signIn(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const selectedRole = String(formData.get("role") || "").trim() as AppRole;
  const next = String(formData.get("next") || "");

  if (!email || !password || !selectedRole) {
    return { error: "Email, mot de passe et rôle requis." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.active) {
    return { error: "Identifiants invalides pour ce rôle." };
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword || user.role !== selectedRole) {
    return { error: "Identifiants invalides pour ce rôle." };
  }

  await setSessionUser(user.id);
  revalidatePath("/", "layout");

  redirect(next && next.startsWith("/") ? next : ROLE_ROUTES[user.role as AppRole]);
}

export async function signOut() {
  await clearSessionUser();
  revalidatePath("/", "layout");
  redirect("/");
}
