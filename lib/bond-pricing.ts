import type { CashFlow } from "@/types/bond";

export interface PricingResult {
  /** prix théorique, en % du nominal */
  cleanPricePct: number;
  /** prix théorique, en MAD */
  price: number;
  macaulayDuration: number; // years
  modifiedDuration: number; // years
}

/**
 * Prices a bond by discounting its remaining coupon + principal cash flows
 * at the given required yield, and derives Macaulay / modified duration.
 *
 * @param bond obligation à valoriser
 * @param yieldRatePct taux de rendement exigé, en %
 */
export function priceBond(cashFlows: CashFlow[], yieldRatePct: number): PricingResult {
  const pricingDate = new Date();
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
  };
}
