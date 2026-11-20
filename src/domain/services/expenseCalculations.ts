import type { Expense, MonthPeriod } from '../entities/Expense';
import { getMonthDateRange } from '../utils/dateUtils';

export interface MonthlySummary {
  readonly period: MonthPeriod;
  readonly totalCents: number;
  readonly count: number;
  readonly expenses: Expense[];
}

export function calculateMonthlyTotal(expenses: readonly Expense[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amountCents, 0);
}

export function filterExpensesByMonth(
  expenses: readonly Expense[],
  period: MonthPeriod
): Expense[] {
  const { startDate, endDate } = getMonthDateRange(period);
  return expenses.filter(
    (expense) => expense.date >= startDate && expense.date < endDate
  );
}

export function sortExpensesChronologically(
  expenses: readonly Expense[]
): Expense[] {
  return [...expenses].sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    if (a.createdAt !== b.createdAt) {
      return b.createdAt.localeCompare(a.createdAt);
    }
    return b.id.localeCompare(a.id);
  });
}

export function calculateMonthlySummary(
  expenses: readonly Expense[],
  period: MonthPeriod
): MonthlySummary {
  const filtered = filterExpensesByMonth(expenses, period);
  const sorted = sortExpensesChronologically(filtered);
  return {
    period,
    totalCents: calculateMonthlyTotal(sorted),
    count: sorted.length,
    expenses: sorted,
  };
}
