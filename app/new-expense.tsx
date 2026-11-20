import { useLocalSearchParams } from 'expo-router';

import type { MonthPeriod } from '@/domain/entities/Expense';
import { NewExpenseScreen } from '@/presentation/screens/NewExpenseScreen';

function extractSingleParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseInitialPeriod(
  yearParam: string | undefined,
  monthParam: string | undefined
): MonthPeriod | undefined {
  if (!yearParam || !monthParam) {
    return undefined;
  }
  const year = Number(yearParam);
  const month = Number(monthParam);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    year < 1900 ||
    year > 2999
  ) {
    return undefined;
  }
  return { year, month };
}

export default function NewExpenseRoute() {
  const params = useLocalSearchParams<{
    expenseId?: string | string[];
    year?: string | string[];
    month?: string | string[];
  }>();

  const expenseId = extractSingleParam(params.expenseId);
  const initialPeriod = parseInitialPeriod(
    extractSingleParam(params.year),
    extractSingleParam(params.month)
  );

  return (
    <NewExpenseScreen expenseId={expenseId} initialPeriod={initialPeriod} />
  );
}
