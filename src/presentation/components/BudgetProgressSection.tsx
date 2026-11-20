import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { BudgetEvaluation } from '@/domain/entities/Budget';
import { formatCentsToBRL } from '@/domain/services/currency';

import { theme } from '../theme/theme';

interface BudgetProgressSectionProps {
  readonly evaluation: BudgetEvaluation | null;
  readonly onPressConfigure: () => void;
}

export function BudgetProgressSection({
  evaluation,
  onPressConfigure,
}: BudgetProgressSectionProps) {
  if (!evaluation) {
    return (
      <View style={styles.emptyWrapper}>
        <Pressable
          onPress={onPressConfigure}
          accessibilityRole="button"
          accessibilityLabel="Definir orçamento mensal"
          style={({ pressed }) => [
            styles.defineButton,
            pressed && styles.pressed,
          ]}
        >
          <Feather name="sliders" size={14} color={theme.colors.textPrimary} />
          <Text style={styles.defineButtonText}>Definir orçamento</Text>
        </Pressable>
      </View>
    );
  }

  const barColor =
    evaluation.status === 'exceeded'
      ? theme.colors.danger
      : evaluation.status === 'warning'
        ? theme.colors.accentMustard
        : theme.colors.accentSage;

  const progressWidthPercent = `${Math.round(evaluation.progressRatio * 100)}%` as const;

  const exceededAmount = Math.abs(evaluation.remainingCents);

  return (
    <Pressable
      onPress={onPressConfigure}
      accessibilityRole="button"
      accessibilityLabel="Editar orçamento mensal"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Orçamento do mês</Text>
          <Feather name="edit-2" size={12} color={theme.colors.textSecondary} />
        </View>

        <View
          style={[
            styles.percentPill,
            evaluation.status === 'exceeded' && styles.percentPillExceeded,
            evaluation.status === 'warning' && styles.percentPillWarning,
          ]}
        >
          <Text
            style={[
              styles.percentText,
              evaluation.status === 'exceeded' && styles.percentTextExceeded,
            ]}
          >
            {evaluation.percentage}%
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: progressWidthPercent,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>

      <Text style={styles.summaryText}>
        {formatCentsToBRL(evaluation.spentCents)} de{' '}
        {formatCentsToBRL(evaluation.limitCents)} • {evaluation.percentage}%
      </Text>

      {evaluation.status === 'exceeded' ? (
        <View style={styles.exceededAlert} accessibilityRole="alert">
          <Feather name="alert-circle" size={14} color={theme.colors.danger} />
          <Text style={styles.exceededAlertText}>
            {exceededAmount > 0
              ? `Orçamento excedido em ${formatCentsToBRL(exceededAmount)}`
              : 'Limite mensal do orçamento atingido'}
          </Text>
        </View>
      ) : evaluation.status === 'warning' ? (
        <View style={styles.warningAlert}>
          <Feather
            name="alert-triangle"
            size={13}
            color={theme.colors.textPrimary}
          />
          <Text style={styles.warningAlertText}>
            Atenção: restam {formatCentsToBRL(evaluation.remainingCents)} do
            limite
          </Text>
        </View>
      ) : (
        <Text style={styles.normalHint}>
          Restam {formatCentsToBRL(evaluation.remainingCents)} disponíveis neste
          mês
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  emptyWrapper: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  defineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  defineButtonText: {
    ...theme.typography.caption,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  card: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.item,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    ...theme.typography.caption,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  percentPill: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  percentPillWarning: {
    backgroundColor: '#F8EAC0',
  },
  percentPillExceeded: {
    backgroundColor: theme.colors.dangerSurface,
  },
  percentText: {
    ...theme.typography.caption,
    ...theme.typography.tabularNums,
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  percentTextExceeded: {
    color: theme.colors.danger,
  },
  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceMuted,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.pill,
  },
  summaryText: {
    ...theme.typography.caption,
    ...theme.typography.tabularNums,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  normalHint: {
    ...theme.typography.caption,
    ...theme.typography.tabularNums,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  warningAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8EAC0',
    borderRadius: theme.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  warningAlertText: {
    ...theme.typography.caption,
    ...theme.typography.tabularNums,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    flexShrink: 1,
  },
  exceededAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.dangerSurface,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  exceededAlertText: {
    ...theme.typography.caption,
    ...theme.typography.tabularNums,
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.danger,
    flexShrink: 1,
  },
});
