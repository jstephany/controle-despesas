import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getCategoryMetadata } from '@/domain/entities/Category';
import type { Expense } from '@/domain/entities/Expense';
import { formatCentsToBRL } from '@/domain/services/currency';
import { formatIsoDateToBR } from '@/domain/utils/dateUtils';

import { getCategoryVisual, theme } from '../theme/theme';

interface ExpenseItemProps {
  readonly expense: Expense;
  readonly onRequestDelete: (expense: Expense) => void;
}

export function ExpenseItem({ expense, onRequestDelete }: ExpenseItemProps) {
  const categoryMeta = getCategoryMetadata(expense.category);
  const visual = getCategoryVisual(expense.category);

  return (
    <View style={styles.card}>
      <View style={[styles.iconBadge, { backgroundColor: visual.fill }]}>
        <Feather name={visual.icon} size={18} color={theme.colors.textPrimary} />
      </View>

      <View style={styles.content}>
        <Text style={styles.description} numberOfLines={1}>
          {expense.description}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText} numberOfLines={1}>
            {categoryMeta.label}
          </Text>
          <View style={styles.metaDot} />
          <Text style={styles.metaDate}>{formatIsoDateToBR(expense.date)}</Text>
        </View>
      </View>

      <View style={styles.trailing}>
        <Text style={styles.amount} numberOfLines={1}>
          {formatCentsToBRL(expense.amountCents)}
        </Text>
        <Pressable
          onPress={() => onRequestDelete(expense)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Excluir despesa ${expense.description}`}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.deleteButtonPressed,
          ]}
        >
          <Feather name="trash-2" size={15} color={theme.colors.danger} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.item,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 3,
  },
  description: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    flexShrink: 1,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.textSecondary,
    opacity: 0.6,
  },
  metaDate: {
    ...theme.typography.caption,
    ...theme.typography.tabularNums,
    color: theme.colors.textSecondary,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  amount: {
    ...theme.typography.body,
    ...theme.typography.tabularNums,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.dangerSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
});
