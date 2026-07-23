import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Suppression de toutes les données (obligations, cash-flows, courbes, historique)...");
  
  await prisma.cashFlow.deleteMany({});
  await prisma.historyEntry.deleteMany({});
  await prisma.bond.deleteMany({});
  await prisma.yieldCurvePoint.deleteMany({});
  await prisma.zeroCouponCurvePoint.deleteMany({});

  console.log("Données supprimées avec succès. Les utilisateurs restent préservés.");
}

main()
  .catch((e) => {
    console.error("Erreur lors de la suppression des données:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
