import { StyleSheet, Text, View } from 'react-native';

import { getCategoryMetadata } from '@/domain/entities/Category';
import { formatCentsToBRL } from '@/domain/services/currency';
import type { CategoryBreakdownItem } from '@/domain/services/expenseCalculations';

import { getCategoryVisual, theme } from '../theme/theme';

interface MonthlySummaryCardProps {
  readonly totalCents: number;
  readonly expenseCount: number;
  readonly categoryBreakdown: readonly CategoryBreakdownItem[];
}

const CHART_MAX_HEIGHT = 76;
const CHART_MIN_ACTIVE_HEIGHT = 14;
const CHART_EMPTY_BAR_HEIGHT = 6;

export function MonthlySummaryCard({
  totalCents,
  expenseCount,
  categoryBreakdown,
}: MonthlySummaryCardProps) {
  const topCategory = categoryBreakdown.reduce<CategoryBreakdownItem | null>(
    (highest, item) => {
      if (item.totalCents <= 0) {
        return highest;
      }
      if (!highest || item.totalCents > highest.totalCents) {
        return item;
      }
      return highest;
    },
    null
  );

  const countLabel =
    expenseCount === 0
      ? 'Sem gastos'
      : expenseCount === 1
        ? '1 lançamento'
        : `${expenseCount} lançamentos`;

  const topVisual = topCategory ? getCategoryVisual(topCategory.category) : null;
  const topMeta = topCategory ? getCategoryMetadata(topCategory.category) : null;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.eyebrow}>Total gasto no mês</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{countLabel}</Text>
        </View>
      </View>

      <Text style={styles.totalValue} adjustsFontSizeToFit numberOfLines={1}>
        {formatCentsToBRL(totalCents)}
      </Text>

      <View style={styles.highlightRow}>
        {topCategory && topVisual && topMeta ? (
          <View style={styles.highlightBadge}>
            <View
              style={[styles.highlightDot, { backgroundColor: topVisual.fill }]}
            />
            <Text style={styles.highlightText}>
              Maior categoria: {topMeta.label} · {topCategory.percentage}%
            </Text>
          </View>
        ) : (
          <Text style={styles.highlightPlaceholder}>
            Distribuição por categoria aparecerá aqui
          </Text>
        )}
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.barsRow}>
          {categoryBreakdown.map((item) => {
            const visual = getCategoryVisual(item.category);
            const hasSpend = item.totalCents > 0;
            const barHeight = hasSpend
              ? Math.max(
                  CHART_MIN_ACTIVE_HEIGHT,
                  Math.round(item.ratioToMax * CHART_MAX_HEIGHT)
                )
              : CHART_EMPTY_BAR_HEIGHT;

            return (
              <View key={item.category} style={styles.barColumn}>
                <View style={styles.barTrack}>
                  {hasSpend && item.percentage > 0 ? (
                    <Text style={styles.barPercent}>{item.percentage}%</Text>
                  ) : null}
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: barHeight,
                        backgroundColor: hasSpend
                          ? visual.fill
                          : theme.colors.inkEmptyBar,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.baseline} />

        <View style={styles.labelsRow}>
          {categoryBreakdown.map((item) => {
            const visual = getCategoryVisual(item.category);
            const hasSpend = item.totalCents > 0;
            return (
              <Text
                key={item.category}
                style={[styles.barLabel, hasSpend && styles.barLabelActive]}
                numberOfLines={1}
              >
                {visual.shortLabel}
              </Text>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.ink,
    borderRadius: theme.radius.card,
    padding: theme.spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  eyebrow: {
    ...theme.typography.micro,
    color: theme.colors.textMutedOnInk,
  },
  countBadge: {
    backgroundColor: theme.colors.inkElevated,
    borderWidth: 1,
    borderColor: theme.colors.inkDivider,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: {
    ...theme.typography.caption,
    ...theme.typography.tabularNums,
    fontSize: 12,
    color: theme.colors.textOnInk,
  },
  totalValue: {
    ...theme.typography.display,
    ...theme.typography.tabularNums,
    color: theme.colors.textOnInk,
    marginTop: 10,
  },
  highlightRow: {
    marginTop: 8,
    minHeight: 22,
    justifyContent: 'center',
  },
  highlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  highlightDot: {
    width: 8,
    height: 8,
    borderRadius: theme.radius.pill,
  },
  highlightText: {
    ...theme.typography.caption,
    ...theme.typography.tabularNums,
    color: theme.colors.textMutedOnInk,
  },
  highlightPlaceholder: {
    ...theme.typography.caption,
    color: theme.colors.textMutedOnInk,
    opacity: 0.8,
  },
  chartContainer: {
    marginTop: theme.spacing.xl,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
    height: CHART_MAX_HEIGHT + 20,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barPercent: {
    ...theme.typography.tabularNums,
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textMutedOnInk,
  },
  barFill: {
    width: '82%',
    maxWidth: 34,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  baseline: {
    height: 1,
    backgroundColor: theme.colors.inkDivider,
    marginTop: 2,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 8,
  },
  barLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.textMutedOnInk,
    opacity: 0.7,
  },
  barLabelActive: {
    color: theme.colors.textOnInk,
    fontWeight: '700',
    opacity: 1,
  },
});
