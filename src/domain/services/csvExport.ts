import {
  getCategoryMetadata,
  type ExpenseCategory,
} from '../entities/Category';
import type { Expense } from '../entities/Expense';
import { formatIsoDateToBR, getTodayIsoDate } from '../utils/dateUtils';
import type { AnalyticsPeriodPreset } from './analyticsService';
import { formatCentsToInputValue } from './currency';

const CSV_HEADER = 'Data,Descrição,Categoria,Valor (R$)';

const PRESET_SLUGS: Record<AnalyticsPeriodPreset, string> = {
  last_3_months: 'ultimos-3-meses',
  last_6_months: 'ultimos-6-meses',
  this_year: 'este-ano',
  all: 'tudo',
};

function escapeCsvCell(value: string): string {
  const needsQuotes = /[",\r\n]/.test(value);
  if (!needsQuotes) {
    return value;
  }
  return `"${value.replace(/"/g, '""')}"`;
}

export function formatExpensesToCsv(expenses: readonly Expense[]): string {
  if (expenses.length === 0) {
    return CSV_HEADER;
  }

  const rows = expenses.map((expense) => {
    const formattedDate = formatIsoDateToBR(expense.date);
    const categoryLabel = getCategoryMetadata(expense.category).label;
    const formattedAmount = formatCentsToInputValue(expense.amountCents);

    return [
      escapeCsvCell(formattedDate),
      escapeCsvCell(expense.description),
      escapeCsvCell(categoryLabel),
      escapeCsvCell(formattedAmount),
    ].join(',');
  });

  return [CSV_HEADER, ...rows].join('\n');
}

export function buildCsvFileName(
  preset: AnalyticsPeriodPreset,
  categoryFilter: ExpenseCategory | null,
  referenceDate: Date = new Date()
): string {
  const dateSlug = getTodayIsoDate(referenceDate);
  const presetSlug = PRESET_SLUGS[preset];
  const categoryPart = categoryFilter ? `-${categoryFilter}` : '';
  return `despesas-${presetSlug}${categoryPart}-${dateSlug}.csv`;
}
