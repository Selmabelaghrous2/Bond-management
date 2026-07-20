import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
type Pricer = { base: Record<string, string>[]; curve: Record<string, string>[]; zeroCoupon: Record<string, string>[]; schedule: Record<string, string>[] };

function number(value?: string): number | null {
  const normalized = value?.replace(/\s/g, "").replace("%", "").replace(",", ".");
  if (!normalized || normalized === "-" || normalized.includes("#")) return null;
  const result = Number(normalized);
  return Number.isFinite(result) ? result : null;
}

function date(value?: string): Date | null {
  if (!value || value === "-") return null;
  const parts = value.split(/[/-]/);
  if (parts.length !== 3) return null;
  const [a, b, c] = parts.map(Number);
  const result = a > 1900 ? new Date(Date.UTC(a, b - 1, c)) : new Date(Date.UTC(c, b - 1, a));
  return Number.isNaN(result.getTime()) ? null : result;
}

function frequency(value: string): 1 | 2 | 4 | 12 {
  return value === "Mensuel" ? 12 : value === "Trimestrielle" ? 4 : value === "Semestrielle" ? 2 : 1;
}

function readPricer(): Pricer {
  if (process.platform !== "win32") throw new Error("L'import du Pricer requiert Windows et Excel installés.");
  const output = execFileSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", join(process.cwd(), "prisma", "read-pricer.ps1")], { encoding: "utf8", maxBuffer: 25 * 1024 * 1024 });
  return JSON.parse(output) as Pricer;
}

async function main() {
  for (const user of [
    { email: "admin@bond.com", password: "admin123" as const, role: "admin" as const },
    { email: "backoffice@bond.com", password: "backoffice123" as const, role: "backoffice" as const },
    { email: "analyste@bond.com", password: "analyste123" as const, role: "analyste" as const },
    { email: "systeme@bond.com", password: "systeme123" as const, role: "systeme" as const },
  ]) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: { passwordHash, role: user.role },
      create: { email: user.email, passwordHash, role: user.role },
    });
  }

  const pricer = readPricer();
  const bonds = new Map<string, string>();
  for (const row of pricer.base) {
    const issueDate = date(row.issueDate);
    const maturityDate = date(row.maturityDate);
    const nominal = number(row.nominal);
    const couponRate = number(row.rate);
    if (!issueDate || !maturityDate || nominal === null || couponRate === null) continue;
    const bond = await prisma.bond.upsert({
      where: { isin: row.code },
      update: { name: `Titre ${row.code}`, nominal, couponRate, frequency: frequency(row.frequency), issueDate, maturityDate, valueDate: date(row.valueDate), isFloating: row.floating === "Oui", isAmortizing: row.amortizing === "Oui", amortizationDeferral: row.deferral || null, schedule: row.schedule || null, comments: row.comments || null, wgRate: number(row.wg), ctRate: number(row.ct), cfgRate: number(row.cfg), status: maturityDate < new Date() ? "matured" : "active" },
      create: { isin: row.code, name: `Titre ${row.code}`, nominal, couponRate, frequency: frequency(row.frequency), issueDate, maturityDate, valueDate: date(row.valueDate), isFloating: row.floating === "Oui", isAmortizing: row.amortizing === "Oui", amortizationDeferral: row.deferral || null, schedule: row.schedule || null, comments: row.comments || null, wgRate: number(row.wg), ctRate: number(row.ct), cfgRate: number(row.cfg), status: maturityDate < new Date() ? "matured" : "active" },
    });
    bonds.set(row.code, bond.id);
  }

  for (const row of pricer.schedule) {
    const cashFlowDate = date(row.date);
    if (!cashFlowDate) continue;
    await prisma.cashFlow.upsert({ where: { source_cashFlowDate: { source: `Pricer_Echeancier_${row.code}`, cashFlowDate } }, update: { principal: number(row.principal) ?? 0, outstanding: number(row.outstanding), grossCoupon: number(row.interest) ?? 0, bondId: bonds.get(row.code) }, create: { source: `Pricer_Echeancier_${row.code}`, cashFlowDate, principal: number(row.principal) ?? 0, outstanding: number(row.outstanding), grossCoupon: number(row.interest) ?? 0, bondId: bonds.get(row.code) } });
  }

  for (const row of pricer.curve) {
    const valuationDate = date(row.valuationDate); const maturityDate = date(row.maturityDate); const weightedRate = number(row.weightedRate);
    if (!valuationDate || !maturityDate || weightedRate === null) continue;
    await prisma.yieldCurvePoint.upsert({ where: { valuationDate_maturityDate: { valuationDate, maturityDate } }, update: { daysToMaturity: number(row.days) ?? 0, weightedRate, moneyMarketRate: number(row.moneyRate), actuarialRate: number(row.actuarialRate) }, create: { valuationDate, maturityDate, daysToMaturity: number(row.days) ?? 0, weightedRate, moneyMarketRate: number(row.moneyRate), actuarialRate: number(row.actuarialRate) } });
  }

  for (const row of pricer.zeroCoupon) {
    const valuationDate = date(row.valuationDate); const maturity = number(row.maturity); const zeroCouponRate = number(row.rate);
    if (!valuationDate || maturity === null || zeroCouponRate === null) continue;
    await prisma.zeroCouponCurvePoint.upsert({ where: { valuationDate_maturityMode_maturity: { valuationDate, maturityMode: row.mode, maturity } }, update: { zeroCouponRate }, create: { valuationDate, maturityMode: row.mode, maturity, zeroCouponRate } });
  }

  const bond5166 = bonds.get("5166") ?? null;
  const lines = readFileSync(join(process.cwd(), "data", "CashFlow_5166.csv"), "utf8").trim().split(/\r?\n/).slice(1);
  for (const line of lines) {
    const [flowDate, settlementDate, principal, couponRate, grossCoupon] = line.split(";");
    const cashFlowDate = date(flowDate);
    if (!cashFlowDate) continue;
    await prisma.cashFlow.upsert({ where: { source_cashFlowDate: { source: "CashFlow_5166", cashFlowDate } }, update: { settlementDate: date(settlementDate), principal: number(principal) ?? 0, couponRate: number(couponRate), grossCoupon: number(grossCoupon) ?? 0, bondId: bond5166 }, create: { source: "CashFlow_5166", cashFlowDate, settlementDate: date(settlementDate), principal: number(principal) ?? 0, couponRate: number(couponRate), grossCoupon: number(grossCoupon) ?? 0, bondId: bond5166 } });
  }
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
