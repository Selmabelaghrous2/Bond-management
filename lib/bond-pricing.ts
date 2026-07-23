import type { CashFlow } from "@/types/bond";

export interface PricingResult {
  /** prix théorique, en % du nominal */
  cleanPricePct: number;
  /** prix théorique, en MAD */
  price: number;
  macaulayDuration: number; // years
  modifiedDuration: number; // years
  dirtyPricePct: number;
  accruedInterestPct: number;
  yieldToMaturity: number;
}

/**
 * @param bond obligation à valoriser
 * @param yieldRatePct taux de rendement exigé, en %
 */
export function priceBond(cashFlows: CashFlow[], yieldRatePct: number, pricingDate = new Date()): PricingResult {
  const y = yieldRatePct / 100;

  let pricePct = 0;
  let weightedTime = 0;

  for (const flow of cashFlows) {
    const flowDate = new Date(`${flow.cashFlowDate}T00:00:00Z`);
    const years = (flowDate.getTime() - pricingDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (years < 0) continue;
    const pv = (flow.principal + flow.grossCoupon) * Math.pow(1 + y, -years);
    pricePct += pv;
    weightedTime += years * pv;
  }

  const macaulayDuration = pricePct > 0 ? weightedTime / pricePct : 0;
  const modifiedDuration = macaulayDuration / (1 + y);

  return {
    cleanPricePct: pricePct,
    price: pricePct,
    macaulayDuration,
    modifiedDuration,
    dirtyPricePct: pricePct,
    accruedInterestPct: 0,
    yieldToMaturity: yieldRatePct,
  };
}

export function yieldToMaturity(cashFlows: CashFlow[], marketPricePct: number, pricingDate = new Date()): number | null {
  if (marketPricePct <= 0 || cashFlows.length === 0) return null;
  let low = -0.99;
  let high = 1;
  for (let i = 0; i < 100; i += 1) {
    const mid = (low + high) / 2;
    const price = priceBond(cashFlows, mid * 100, pricingDate).dirtyPricePct;
    if (price > marketPricePct) low = mid;
    else high = mid;
  }
  return ((low + high) / 2) * 100;
}
