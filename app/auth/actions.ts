"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { clearSessionUser, setSessionUser } from "@/lib/auth";
import { ROLE_ROUTES, type AppRole } from "@/types/auth";

export type LoginState = {
  error: string | null;
  redirectTo?: string;
};

export async function signIn(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email || !password ) {
    return { error: "Email et mot de passe requis." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.active) {
    return { error: "Identifiants invalides pour ce rôle." };
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return { error: "Identifiants invalides." };
  }

  await setSessionUser(user.id);
  revalidatePath("/", "layout");

  return {
    error: null,
    redirectTo: ROLE_ROUTES[user.role as AppRole] ?? "/",
  };
}

export async function signOut() {
  await clearSessionUser();
  revalidatePath("/", "layout");
  redirect("/");
}
