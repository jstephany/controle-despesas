export interface MonthlyBudget {
  /** Period identifier in format 'YYYY-MM'. */
  readonly monthKey: string;
  /** Strictly positive integer cents (> 0). */
  readonly limitCents: number;
  readonly updatedAt: string;
}

export type BudgetStatus = 'normal' | 'warning' | 'exceeded';

export interface BudgetEvaluation {
  readonly limitCents: number;
  readonly spentCents: number;
  readonly remainingCents: number;
  readonly percentage: number;
  readonly progressRatio: number;
  readonly status: BudgetStatus;
}
