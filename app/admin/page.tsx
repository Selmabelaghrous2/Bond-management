import { redirect } from "next/navigation";
import { getCurrentUserWithProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeUser } from "@/lib/serializers";
import { AdminApp } from "@/components/AdminApp";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getCurrentUserWithProfile();

  if (!session || session.role !== "admin") {
    redirect("/auth?next=/admin");
  }

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <AdminApp
      email={session.email}
      users={users.map(serializeUser)}
      currentUserId={session.id}
    />
  );
}
