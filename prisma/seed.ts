import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {

  const demoUsers = [
    { email: "admin@bond.com", password: "admin123", role: "admin" as const },
    { email: "backoffice@bond.com", password: "backoffice123", role: "backoffice" as const },
    { email: "analyste@bond.com", password: "analyste123", role: "analyste" as const },
    { email: "systeme@bond.com", password: "systeme123", role: "systeme" as const },
  ];

  for (const u of demoUsers) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { email: u.email, passwordHash, role: u.role },
    });
  }

 
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
}