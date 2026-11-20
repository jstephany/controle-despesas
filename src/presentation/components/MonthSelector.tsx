import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MonthPeriod } from '@/domain/entities/Expense';
import {
  formatMonthPeriodLabel,
  getCurrentMonthPeriod,
} from '@/domain/utils/dateUtils';

import { theme } from '../theme/theme';

interface MonthSelectorProps {
  readonly period: MonthPeriod;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
  readonly onResetToCurrent: () => void;
}

export function MonthSelector({
  period,
  onPrevious,
  onNext,
  onResetToCurrent,
}: MonthSelectorProps) {
  const current = getCurrentMonthPeriod();
  const isCurrentMonth =
    period.year === current.year && period.month === current.month;

  return (
    <View style={styles.row}>
      <View style={styles.pill}>
        <Pressable
          onPress={onPrevious}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Mês anterior"
          style={({ pressed }) => [
            styles.navButton,
            pressed && styles.navButtonPressed,
          ]}
        >
          <Feather name="chevron-left" size={18} color={theme.colors.textPrimary} />
        </Pressable>

        <View style={styles.labelContainer}>
          <Feather name="calendar" size={14} color={theme.colors.textSecondary} />
          <Text style={styles.label} numberOfLines={1}>
            {formatMonthPeriodLabel(period)}
          </Text>
        </View>

        <Pressable
          onPress={onNext}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Próximo mês"
          style={({ pressed }) => [
            styles.navButton,
            pressed && styles.navButtonPressed,
          ]}
        >
          <Feather name="chevron-right" size={18} color={theme.colors.textPrimary} />
        </Pressable>
      </View>

      {!isCurrentMonth ? (
        <Pressable
          onPress={onResetToCurrent}
          accessibilityRole="button"
          accessibilityLabel="Voltar para o mês atual"
          style={({ pressed }) => [
            styles.todayPill,
            pressed && styles.todayPillPressed,
          ]}
        >
          <Text style={styles.todayLabel}>Atual</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  navButton: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceMuted,
  },
  navButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  labelContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  label: {
    ...theme.typography.body,
    ...theme.typography.tabularNums,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  todayPill: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentSage,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  todayPillPressed: {
    opacity: 0.85,
  },
  todayLabel: {
    ...theme.typography.caption,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
});
