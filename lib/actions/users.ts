"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import type { AppRole } from "@/types/auth";

export type UserActionState = { error: string | null };

export async function createUser(input: {
  email: string;
  password: string;
  role: AppRole;
}): Promise<UserActionState> {
  const session = await requireRole("admin");
  if (!session) return { error: "Accès refusé." };

  if (!input.email || !input.password || input.password.length < 8) {
    return { error: "Email requis et mot de passe d'au moins 8 caractères." };
  }

  try {
    const passwordHash = await bcrypt.hash(input.password, 10);
    await prisma.user.create({
      data: { email: input.email.toLowerCase().trim(), passwordHash, role: input.role },
    });
  } catch {
    return { error: "Cet email est déjà utilisé." };
  }

  revalidatePath("/admin");
  return { error: null };
}

export async function updateUserRole(id: string, role: AppRole): Promise<UserActionState> {
  const session = await requireRole("admin");
  if (!session) return { error: "Accès refusé." };

  await prisma.user.update({ where: { id }, data: { role } }).catch(() => null);
  revalidatePath("/admin");
  return { error: null };
}

export async function toggleUserActive(id: string, active: boolean): Promise<UserActionState> {
  const session = await requireRole("admin");
  if (!session) return { error: "Accès refusé." };

  if (id === session.id && !active) {
    return { error: "Vous ne pouvez pas désactiver votre propre compte." };
  }

  await prisma.user.update({ where: { id }, data: { active } }).catch(() => null);
  revalidatePath("/admin");
  return { error: null };
}

export async function resetUserPassword(id: string, newPassword: string): Promise<UserActionState> {
  const session = await requireRole("admin");
  if (!session) return { error: "Accès refusé." };

  if (newPassword.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id }, data: { passwordHash } }).catch(() => null);
  revalidatePath("/admin");
  return { error: null };
}

export async function deleteUser(id: string): Promise<UserActionState> {
  const session = await requireRole("admin");
  if (!session) return { error: "Accès refusé." };

  if (id === session.id) {
    return { error: "Vous ne pouvez pas supprimer votre propre compte." };
  }

  await prisma.user.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin");
  return { error: null };
}
