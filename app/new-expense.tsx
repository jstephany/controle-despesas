import { useLocalSearchParams } from 'expo-router';

import { NewExpenseScreen } from '@/presentation/screens/NewExpenseScreen';

export default function NewExpenseRoute() {
  const { expenseId } = useLocalSearchParams<{ expenseId?: string | string[] }>();
  const normalizedId = Array.isArray(expenseId) ? expenseId[0] : expenseId;

  return <NewExpenseScreen expenseId={normalizedId} />;
}
