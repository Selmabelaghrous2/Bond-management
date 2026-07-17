import type { Bond } from "@/types/bond";

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
export function priceBond(bond: Bond, yieldRatePct: number): PricingResult {
  const freq = bond.frequency;
  const y = yieldRatePct / 100 / freq;
  const couponPerPeriod = (bond.couponRate / 100 / freq) * 100; // % of nominal per period

  const issue = new Date(bond.issueDate);
  const maturity = new Date(bond.maturityDate);
  const now = new Date();
  const pricingDate = now < issue ? issue : now;

  const yearsRemaining = Math.max(
    (maturity.getTime() - pricingDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
    0
  );
  const periodsRemaining = Math.max(Math.round(yearsRemaining * freq), 1);

  let pricePct = 0;
  let weightedTime = 0;

  for (let t = 1; t <= periodsRemaining; t++) {
    const cashFlow = t === periodsRemaining ? couponPerPeriod + 100 : couponPerPeriod;
    const discountFactor = Math.pow(1 + y, -t);
    const pv = cashFlow * discountFactor;
    pricePct += pv;
    weightedTime += (t / freq) * pv;
  }

  const macaulayDuration = pricePct > 0 ? weightedTime / pricePct : 0;
  const modifiedDuration = macaulayDuration / (1 + y);

  return {
    cleanPricePct: pricePct,
    price: (pricePct / 100) * bond.nominal,
    macaulayDuration,
    modifiedDuration,
  };
}
