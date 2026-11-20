import type { ExpenseCategory } from './Category';

export interface Expense {
  readonly id: string;
  readonly description: string;
  /** Monetary amount stored strictly in positive integer cents (> 0). */
  readonly amountCents: number;
  /** Local calendar date in ISO format 'YYYY-MM-DD' (timezone-safe). */
  readonly date: string;
  readonly category: ExpenseCategory;
  /** Creation timestamp in ISO-8601 UTC used as deterministic tie-breaker. */
  readonly createdAt: string;
}

export interface CreateExpenseInput {
  readonly description: string;
  readonly amountCents: number;
  readonly date: string;
  readonly category: ExpenseCategory;
}

export interface ExpenseFormValues {
  readonly description: string;
  readonly amount: string;
  readonly date: string;
  readonly category: string;
}

export interface MonthPeriod {
  readonly year: number;
  /** 1-indexed month (1 = January, 12 = December). */
  readonly month: number;
}
