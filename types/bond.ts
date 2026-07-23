export type BondStatus = "active" | "suspended" | "matured";

/** Serializable shape used on the client — dates and Decimals become string/number. */
export interface Bond {
  id: string;
  isin: string;
  internalCode: string | null;
  name: string;
  /** valeur nominale, en MAD */
  nominal: number;
  /** taux facial, en % */
  couponRate: number;
  /** paiements de coupon par an */
  frequency: 1 | 2 | 4 | 12;
  issueDate: string; // ISO date (yyyy-mm-dd)
  enjoymentDate: string | null;
  maturityDate: string; // ISO date (yyyy-mm-dd)
  revisionDate: string | null;
  rateType: string | null;
  revisionPeriod: string | null;
  repaymentPeriod: string | null;
  amortizationType: string | null;
  couponPeriod: string | null;
  /** dernier prix de marché connu (% du nominal), null si jamais coté */
  price: number | null;
  status: BondStatus;
  valueDate: string | null;
  valueType: string | null;
  isFloating: boolean;
  isAmortizing: boolean;
  schedule: string | null;
  comments: string | null;
  wgRate: number | null;
  ctRate: number | null;
  cfgRate: number | null;
}

export interface CashFlow {
  id: string;
  source: string;
  cashFlowDate: string;
  settlementDate: string | null;
  principal: number;
  outstanding: number | null;
  couponRate: number | null;
  grossCoupon: number;
  isPaid: boolean;
  paidAt: string | null;
  bondId: string | null;
}

export type HistoryUseCase = "UC02" | "UC03" | "UC05" | "UC06" | "UC08";

export interface HistoryEntry {
  id: string;
  timestamp: string; // ISO datetime
  ucId: HistoryUseCase;
  label: string;
  detail: string;
}
