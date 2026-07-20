import type { Bond as PrismaBond, CashFlow as PrismaCashFlow, HistoryEntry as PrismaHistoryEntry, User as PrismaUser } from "@prisma/client";
import type { Bond, CashFlow, HistoryEntry } from "@/types/bond";
import type { AppUser } from "@/types/user";
import type { AppRole } from "@/types/auth";

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function serializeBond(b: PrismaBond): Bond {
  return {
    id: b.id,
    isin: b.isin,
    name: b.name,
    nominal: Number(b.nominal),
    couponRate: Number(b.couponRate),
    frequency: b.frequency as Bond["frequency"],
    issueDate: toISODate(b.issueDate),
    maturityDate: toISODate(b.maturityDate),
    price: b.price != null ? Number(b.price) : null,
    status: b.status,
    valueDate: b.valueDate ? toISODate(b.valueDate) : null,
    valueType: b.valueType,
    isFloating: b.isFloating,
    isAmortizing: b.isAmortizing,
    schedule: b.schedule,
    comments: b.comments,
    wgRate: b.wgRate != null ? Number(b.wgRate) : null,
    ctRate: b.ctRate != null ? Number(b.ctRate) : null,
    cfgRate: b.cfgRate != null ? Number(b.cfgRate) : null,
  };
}

export function serializeCashFlow(c: PrismaCashFlow): CashFlow {
  return {
    id: c.id,
    source: c.source,
    cashFlowDate: toISODate(c.cashFlowDate),
    settlementDate: c.settlementDate ? toISODate(c.settlementDate) : null,
    principal: Number(c.principal),
    outstanding: c.outstanding != null ? Number(c.outstanding) : null,
    couponRate: c.couponRate != null ? Number(c.couponRate) : null,
    grossCoupon: Number(c.grossCoupon),
    bondId: c.bondId,
  };
}

export function serializeHistoryEntry(h: PrismaHistoryEntry): HistoryEntry {
  return {
    id: h.id,
    timestamp: h.timestamp.toISOString(),
    ucId: h.ucId,
    label: h.label,
    detail: h.detail,
  };
}

export function serializeUser(u: PrismaUser): AppUser {
  return {
    id: u.id,
    email: u.email,
    role: u.role as AppRole,
    active: u.active,
    createdAt: u.createdAt.toISOString(),
  };
}
