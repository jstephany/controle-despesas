import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getCategoryMetadata } from '@/domain/entities/Category';
import type { Expense } from '@/domain/entities/Expense';
import { formatCentsToBRL } from '@/domain/services/currency';
import { formatIsoDateToBR } from '@/domain/utils/dateUtils';

import { getCategoryVisual, theme } from '../theme/theme';

interface ExpenseItemProps {
  readonly expense: Expense;
  readonly onPress: (expense: Expense) => void;
  readonly onRequestDelete: (expense: Expense) => void;
}

export function ExpenseItem({
  expense,
  onPress,
  onRequestDelete,
}: ExpenseItemProps) {
  const categoryMeta = getCategoryMetadata(expense.category);
  const visual = getCategoryVisual(expense.category);

  return (
    <Pressable
      onPress={() => onPress(expense)}
      accessibilityRole="button"
      accessibilityLabel={`Editar despesa ${expense.description}`}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={[styles.iconBadge, { backgroundColor: visual.fill }]}>
        <Feather name={visual.icon} size={17} color={theme.colors.textPrimary} />
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.description} numberOfLines={2}>
            {expense.description}
          </Text>
          <Text style={styles.amount} numberOfLines={1}>
            {formatCentsToBRL(expense.amountCents)}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.metaRow}>
            <Text style={styles.categoryText}>{categoryMeta.label}</Text>
            <View style={styles.metaDot} />
            <Text style={styles.metaDate}>{formatIsoDateToBR(expense.date)}</Text>
          </View>

          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onRequestDelete(expense);
            }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Excluir despesa ${expense.description}`}
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.deleteButtonPressed,
            ]}
          >
            <Feather name="trash-2" size={14} color={theme.colors.danger} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.item,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  cardPressed: {
    opacity: 0.78,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  body: {
    flex: 1,
    gap: 7,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  description: {
    ...theme.typography.bodyBold,
    color: theme.colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  amount: {
    ...theme.typography.numericBody,
    color: theme.colors.textPrimary,
    flexShrink: 0,
    textAlign: 'right',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.textSecondary,
    opacity: 0.6,
  },
  metaDate: {
    ...theme.typography.numericCaption,
    color: theme.colors.textSecondary,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.dangerSurface,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  deleteButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.92 }],
  },
});
