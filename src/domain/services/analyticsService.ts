import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from '../entities/Category';
import type { Expense, MonthPeriod } from '../entities/Expense';
import {
  formatMonthPeriodKey,
  getCurrentMonthPeriod,
  getMonthPeriodFromIsoDate,
  getPreviousMonth,
} from '../utils/dateUtils';
import {
  calculateMonthlyTotal,
  filterExpensesByCategory,
  sortExpensesChronologically,
} from './expenseCalculations';

export type AnalyticsPeriodPreset =
  | 'last_3_months'
  | 'last_6_months'
  | 'this_year'
  | 'all';

export interface MonthlySeriesPoint {
  readonly period: MonthPeriod;
  readonly monthKey: string;
  readonly shortLabel: string;
  readonly totalCents: number;
  readonly ratioToMax: number;
}

export interface CategoryRankItem {
  readonly category: ExpenseCategory;
  readonly totalCents: number;
  readonly percentage: number;
  readonly count: number;
}

export interface PeriodAnalyticsReport {
  readonly preset: AnalyticsPeriodPreset;
  readonly categoryFilter: ExpenseCategory | null;
  readonly totalCents: number;
  readonly monthlyAverageCents: number;
  readonly expenseCount: number;
  readonly monthsCount: number;
  readonly monthlySeries: MonthlySeriesPoint[];
  readonly categoryRanking: CategoryRankItem[];
  readonly filteredExpenses: Expense[];
}

export const ANALYTICS_PERIOD_PRESETS: readonly {
  readonly id: AnalyticsPeriodPreset;
  readonly label: string;
}[] = [
  { id: 'last_3_months', label: 'Últimos 3 meses' },
  { id: 'last_6_months', label: 'Últimos 6 meses' },
  { id: 'this_year', label: 'Este ano' },
  { id: 'all', label: 'Tudo' },
] as const;

const SHORT_MONTH_NAMES = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
] as const;

function buildLastNMonths(
  referencePeriod: MonthPeriod,
  count: number
): MonthPeriod[] {
  const result: MonthPeriod[] = [];
  let cursor = referencePeriod;
  for (let i = 0; i < count; i++) {
    result.push(cursor);
    cursor = getPreviousMonth(cursor);
  }
  return result.reverse();
}

function resolveMonthsForPreset(
  preset: AnalyticsPeriodPreset,
  referencePeriod: MonthPeriod,
  categoryFilteredExpenses: readonly Expense[]
): MonthPeriod[] {
  if (preset === 'last_3_months') {
    return buildLastNMonths(referencePeriod, 3);
  }

  if (preset === 'last_6_months') {
    return buildLastNMonths(referencePeriod, 6);
  }

  if (preset === 'this_year') {
    const months: MonthPeriod[] = [];
    for (let month = 1; month <= referencePeriod.month; month++) {
      months.push({ year: referencePeriod.year, month });
    }
    return months;
  }

  // 'all': distinct months represented in the filtered dataset, chronologically
  const byKey = new Map<string, MonthPeriod>();
  for (const expense of categoryFilteredExpenses) {
    const period = getMonthPeriodFromIsoDate(expense.date);
    if (period) {
      byKey.set(formatMonthPeriodKey(period), period);
    }
  }

  if (byKey.size === 0) {
    return [referencePeriod];
  }

  return [...byKey.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, period]) => period);
}

export function buildPeriodAnalyticsReport(
  allExpenses: readonly Expense[],
  preset: AnalyticsPeriodPreset,
  categoryFilter: ExpenseCategory | null,
  referenceDate: Date = new Date()
): PeriodAnalyticsReport {
  const referencePeriod = getCurrentMonthPeriod(referenceDate);
  const categoryFiltered = filterExpensesByCategory(allExpenses, categoryFilter);

  const months = resolveMonthsForPreset(preset, referencePeriod, categoryFiltered);
  const allowedMonthKeys = new Set(months.map(formatMonthPeriodKey));

  const periodExpenses = sortExpensesChronologically(
    categoryFiltered.filter((expense) => {
      const period = getMonthPeriodFromIsoDate(expense.date);
      return period !== null && allowedMonthKeys.has(formatMonthPeriodKey(period));
    })
  );

  const totalsByMonth = new Map<string, number>();
  for (const key of allowedMonthKeys) {
    totalsByMonth.set(key, 0);
  }

  for (const expense of periodExpenses) {
    const period = getMonthPeriodFromIsoDate(expense.date);
    if (!period) continue;
    const key = formatMonthPeriodKey(period);
    totalsByMonth.set(key, (totalsByMonth.get(key) ?? 0) + expense.amountCents);
  }

  let maxMonthCents = 0;
  for (const value of totalsByMonth.values()) {
    if (value > maxMonthCents) {
      maxMonthCents = value;
    }
  }

  const spansMultipleYears =
    new Set(months.map((period) => period.year)).size > 1;

  const monthlySeries: MonthlySeriesPoint[] = months.map((period) => {
    const monthKey = formatMonthPeriodKey(period);
    const totalCents = totalsByMonth.get(monthKey) ?? 0;
    const monthShort = SHORT_MONTH_NAMES[period.month - 1] ?? '';
    const shortLabel = spansMultipleYears
      ? `${monthShort}/${String(period.year).slice(-2)}`
      : monthShort;

    return {
      period,
      monthKey,
      shortLabel,
      totalCents,
      ratioToMax: maxMonthCents > 0 ? totalCents / maxMonthCents : 0,
    };
  });

  const totalCents = calculateMonthlyTotal(periodExpenses);
  const monthsCount =
    preset === 'all' && periodExpenses.length === 0 ? 0 : months.length;
  const monthlyAverageCents =
    monthsCount > 0 ? Math.round(totalCents / monthsCount) : 0;

  const categoryAccumulator = new Map<
    ExpenseCategory,
    { totalCents: number; count: number }
  >();
  for (const expense of periodExpenses) {
    const current = categoryAccumulator.get(expense.category) ?? {
      totalCents: 0,
      count: 0,
    };
    categoryAccumulator.set(expense.category, {
      totalCents: current.totalCents + expense.amountCents,
      count: current.count + 1,
    });
  }

  const categoryOrder = new Map(
    EXPENSE_CATEGORIES.map((item, index) => [item.id, index])
  );

  const categoryRanking: CategoryRankItem[] = [...categoryAccumulator.entries()]
    .filter(([, stats]) => stats.totalCents > 0)
    .sort(([catA, statsA], [catB, statsB]) => {
      if (statsB.totalCents !== statsA.totalCents) {
        return statsB.totalCents - statsA.totalCents;
      }
      return (categoryOrder.get(catA) ?? 0) - (categoryOrder.get(catB) ?? 0);
    })
    .map(([category, stats]) => ({
      category,
      totalCents: stats.totalCents,
      percentage:
        totalCents > 0 ? Math.round((stats.totalCents / totalCents) * 100) : 0,
      count: stats.count,
    }));

  return {
    preset,
    categoryFilter,
    totalCents,
    monthlyAverageCents,
    expenseCount: periodExpenses.length,
    monthsCount,
    monthlySeries,
    categoryRanking,
    filteredExpenses: periodExpenses,
  };
}
