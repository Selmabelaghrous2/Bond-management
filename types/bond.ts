export type BondStatus = "active" | "suspended" | "matured";

/** Serializable shape used on the client — dates and Decimals become string/number. */
export interface Bond {
  id: string;
  isin: string;
  name: string;
  /** valeur nominale, en MAD */
  nominal: number;
  /** taux facial, en % */
  couponRate: number;
  /** paiements de coupon par an */
  frequency: 1 | 2 | 4 | 12;
  issueDate: string; // ISO date (yyyy-mm-dd)
  maturityDate: string; // ISO date (yyyy-mm-dd)
  /** dernier prix de marché connu (% du nominal), null si jamais coté */
  price: number | null;
  status: BondStatus;
}

export type HistoryUseCase = "UC02" | "UC03" | "UC05" | "UC06" | "UC08";

export interface HistoryEntry {
  id: string;
  timestamp: string; // ISO datetime
  ucId: HistoryUseCase;
  label: string;
  detail: string;
}
