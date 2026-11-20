import { EXPENSE_CATEGORIES, type ExpenseCategory } from '../entities/Category';
import type { Expense, MonthPeriod } from '../entities/Expense';
import { getMonthDateRange } from '../utils/dateUtils';

export interface MonthlySummary {
  readonly period: MonthPeriod;
  readonly totalCents: number;
  readonly count: number;
  readonly expenses: Expense[];
}

export interface CategoryBreakdownItem {
  readonly category: ExpenseCategory;
  readonly totalCents: number;
  readonly percentage: number;
  readonly ratioToMax: number;
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

export function calculateCategoryBreakdown(
  expenses: readonly Expense[]
): CategoryBreakdownItem[] {
  const totalsByCategory = new Map<ExpenseCategory, number>();
  for (const item of EXPENSE_CATEGORIES) {
    totalsByCategory.set(item.id, 0);
  }

  let grandTotal = 0;
  for (const expense of expenses) {
    const prev = totalsByCategory.get(expense.category) ?? 0;
    totalsByCategory.set(expense.category, prev + expense.amountCents);
    grandTotal += expense.amountCents;
  }

  let maxCents = 0;
  for (const total of totalsByCategory.values()) {
    if (total > maxCents) {
      maxCents = total;
    }
  }

  return EXPENSE_CATEGORIES.map(({ id }) => {
    const totalCents = totalsByCategory.get(id) ?? 0;
    return {
      category: id,
      totalCents,
      percentage: grandTotal > 0 ? Math.round((totalCents / grandTotal) * 100) : 0,
      ratioToMax: maxCents > 0 ? totalCents / maxCents : 0,
    };
  });
}
