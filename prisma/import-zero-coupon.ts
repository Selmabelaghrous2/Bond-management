import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseDate(value: string): Date {
  const [year, month, day] = value.split(/[/-]/).map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function parseNumber(value: string): number | null {
  const result = Number(value.replace(/\s/g, "").replace("%", "").replace(",", "."));
  return Number.isFinite(result) ? result : null;
}

async function main() {
  const raw = execFileSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", join(process.cwd(), "prisma", "read-pricer.ps1")], { encoding: "utf8", maxBuffer: 25 * 1024 * 1024 });
  const { zeroCoupon } = JSON.parse(raw) as { zeroCoupon: { valuationDate: string; mode: string; maturity: string; rate: string }[] };
  for (const point of zeroCoupon) {
    const maturity = parseNumber(point.maturity);
    const zeroCouponRate = parseNumber(point.rate);
    if (!point.valuationDate || maturity === null || zeroCouponRate === null) continue;
    const valuationDate = parseDate(point.valuationDate);
    await prisma.zeroCouponCurvePoint.upsert({
      where: { valuationDate_maturityMode_maturity: { valuationDate, maturityMode: point.mode, maturity } },
      update: { zeroCouponRate },
      create: { valuationDate, maturityMode: point.mode, maturity, zeroCouponRate },
    });
  }
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
