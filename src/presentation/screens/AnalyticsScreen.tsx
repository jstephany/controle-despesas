import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { exportCsvFile } from '@/data/export/csvShareService';
import {
  getCategoryMetadata,
  type ExpenseCategory,
} from '@/domain/entities/Category';
import {
  ANALYTICS_PERIOD_PRESETS,
  buildPeriodAnalyticsReport,
  type AnalyticsPeriodPreset,
} from '@/domain/services/analyticsService';
import {
  buildCsvFileName,
  formatExpensesToCsv,
} from '@/domain/services/csvExport';
import { formatCentsToBRL } from '@/domain/services/currency';

import { CategoryFilterBar } from '../components/CategoryFilterBar';
import { useExpenses } from '../hooks/useExpenses';
import { getCategoryVisual, theme } from '../theme/theme';

const CHART_MAX_HEIGHT = 92;
const CHART_MIN_ACTIVE_HEIGHT = 14;
const CHART_EMPTY_BAR_HEIGHT = 6;

function formatCompactCents(cents: number): string {
  const reais = cents / 100;
  if (reais >= 1000) {
    const thousands = reais / 1000;
    const formatted =
      thousands >= 10
        ? Math.round(thousands).toString()
        : thousands.toFixed(1).replace('.', ',');
    return `${formatted}k`;
  }
  return Math.round(reais).toString();
}

export function AnalyticsScreen() {
  const { allExpenses, isInitializing } = useExpenses();

  const [preset, setPreset] = useState<AnalyticsPeriodPreset>('last_3_months');
  const [selectedCategory, setSelectedCategory] =
    useState<ExpenseCategory | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const report = useMemo(
    () => buildPeriodAnalyticsReport(allExpenses, preset, selectedCategory),
    [allExpenses, preset, selectedCategory]
  );

  const peakMonthKey = useMemo(() => {
    let bestKey: string | null = null;
    let bestCents = 0;
    for (const point of report.monthlySeries) {
      if (point.totalCents > bestCents) {
        bestCents = point.totalCents;
        bestKey = point.monthKey;
      }
    }
    return bestKey;
  }, [report.monthlySeries]);

  const activeBarColor = selectedCategory
    ? getCategoryVisual(selectedCategory).fill
    : theme.colors.accentPeriwinkle;

  const isScrollableChart = report.monthlySeries.length > 6;

  const handleExportCsv = async () => {
    if (report.filteredExpenses.length === 0) {
      Alert.alert(
        'Sem dados para exportar',
        'Não há despesas registradas para o período e filtro selecionados.'
      );
      return;
    }

    setIsExporting(true);
    try {
      const csv = formatExpensesToCsv(report.filteredExpenses);
      const fileName = buildCsvFileName(preset, selectedCategory);
      await exportCsvFile(fileName, csv);
    } catch (err) {
      Alert.alert(
        'Erro ao exportar CSV',
        err instanceof Error
          ? err.message
          : 'Não foi possível gerar ou compartilhar o relatório.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const renderChartColumns = () =>
    report.monthlySeries.map((point) => {
      const hasSpend = point.totalCents > 0;
      const isPeak = hasSpend && point.monthKey === peakMonthKey && !selectedCategory;
      const barHeight = hasSpend
        ? Math.max(
            CHART_MIN_ACTIVE_HEIGHT,
            Math.round(point.ratioToMax * CHART_MAX_HEIGHT)
          )
        : CHART_EMPTY_BAR_HEIGHT;

      return (
        <View
          key={point.monthKey}
          style={[
            styles.barColumn,
            isScrollableChart && styles.barColumnScrollable,
          ]}
        >
          <View style={styles.barTrack}>
            {hasSpend ? (
              <Text style={styles.barValue} numberOfLines={1}>
                {formatCompactCents(point.totalCents)}
              </Text>
            ) : null}
            <View
              style={[
                styles.barFill,
                {
                  height: barHeight,
                  backgroundColor: hasSpend
                    ? isPeak
                      ? theme.colors.accentMustard
                      : activeBarColor
                    : theme.colors.inkEmptyBar,
                },
              ]}
            />
          </View>
          <Text
            style={[styles.barMonthLabel, hasSpend && styles.barMonthLabelActive]}
            numberOfLines={1}
          >
            {point.shortLabel}
          </Text>
        </View>
      );
    });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.eyebrow}>Relatórios offline</Text>
            <Text style={styles.title}>Análise</Text>
          </View>

          <Pressable
            onPress={() => void handleExportCsv()}
            disabled={isExporting || report.filteredExpenses.length === 0}
            accessibilityRole="button"
            accessibilityLabel="Exportar relatório em CSV"
            style={({ pressed }) => [
              styles.exportButton,
              (isExporting || report.filteredExpenses.length === 0) &&
                styles.exportButtonDisabled,
              pressed &&
                !isExporting &&
                report.filteredExpenses.length > 0 &&
                styles.pressed,
            ]}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color={theme.colors.textPrimary} />
            ) : (
              <Feather
                name="share"
                size={15}
                color={theme.colors.textPrimary}
              />
            )}
            <Text style={styles.exportLabel}>Exportar CSV</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodChipsRow}
        >
          {ANALYTICS_PERIOD_PRESETS.map((item) => {
            const isActive = preset === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setPreset(item.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                style={({ pressed }) => [
                  styles.periodChip,
                  isActive && styles.periodChipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.periodChipLabel,
                    isActive && styles.periodChipLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.categoryFilterWrapper}>
          <CategoryFilterBar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </View>

        <View style={styles.darkCard}>
          <View style={styles.metricsRow}>
            <View style={styles.metricBlock}>
              <Text style={styles.metricEyebrow}>Total do período</Text>
              <Text
                style={styles.metricTotal}
                adjustsFontSizeToFit
                numberOfLines={1}
              >
                {formatCentsToBRL(report.totalCents)}
              </Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricBlock}>
              <Text style={styles.metricEyebrow}>Média mensal</Text>
              <Text
                style={styles.metricAverage}
                adjustsFontSizeToFit
                numberOfLines={1}
              >
                {formatCentsToBRL(report.monthlyAverageCents)}
              </Text>
            </View>
          </View>

          <View style={styles.metaBadgeRow}>
            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeText}>
                {report.expenseCount}{' '}
                {report.expenseCount === 1 ? 'lançamento' : 'lançamentos'}
              </Text>
            </View>
            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeText}>
                {report.monthsCount}{' '}
                {report.monthsCount === 1 ? 'mês' : 'meses'}
              </Text>
            </View>
            {selectedCategory ? (
              <View
                style={[
                  styles.metaCategoryBadge,
                  {
                    backgroundColor: getCategoryVisual(selectedCategory).fill,
                  },
                ]}
              >
                <Text style={styles.metaCategoryText}>
                  {getCategoryMetadata(selectedCategory).label}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>Evolução mensal</Text>
            {isScrollableChart ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.barsRowScrollable}
              >
                {renderChartColumns()}
              </ScrollView>
            ) : (
              <View style={styles.barsRow}>{renderChartColumns()}</View>
            )}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Resumo por categoria</Text>
          <Text style={styles.sectionSubtitle}>Maior para menor</Text>
        </View>

        {isInitializing ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator size="small" color={theme.colors.ink} />
            <Text style={styles.emptyText}>Carregando análise...</Text>
          </View>
        ) : report.categoryRanking.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Feather
                name="bar-chart-2"
                size={20}
                color={theme.colors.textPrimary}
              />
            </View>
            <Text style={styles.emptyTitle}>
              Sem gastos no período selecionado
            </Text>
            <Text style={styles.emptyText}>
              Altere o filtro acima ou adicione novas despesas no botão central.
            </Text>
          </View>
        ) : (
          <View style={styles.rankingList}>
            {report.categoryRanking.map((item) => {
              const meta = getCategoryMetadata(item.category);
              const visual = getCategoryVisual(item.category);
              const widthPercent = `${Math.max(4, item.percentage)}%` as const;

              return (
                <View key={item.category} style={styles.rankingCard}>
                  <View style={styles.rankingTop}>
                    <View style={styles.rankingLeft}>
                      <View
                        style={[
                          styles.rankingIconBadge,
                          { backgroundColor: visual.fill },
                        ]}
                      >
                        <Feather
                          name={visual.icon}
                          size={16}
                          color={theme.colors.textPrimary}
                        />
                      </View>
                      <View style={styles.rankingInfo}>
                        <Text style={styles.rankingName}>{meta.label}</Text>
                        <Text style={styles.rankingCount}>
                          {item.count}{' '}
                          {item.count === 1 ? 'lançamento' : 'lançamentos'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.rankingRight}>
                      <Text style={styles.rankingAmount}>
                        {formatCentsToBRL(item.totalCents)}
                      </Text>
                      <Text style={styles.rankingPercent}>
                        {item.percentage}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rankingTrack}>
                    <View
                      style={[
                        styles.rankingFill,
                        {
                          width: widthPercent,
                          backgroundColor: visual.fill,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: 124,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  eyebrow: {
    ...theme.typography.micro,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  exportButtonDisabled: {
    opacity: 0.45,
  },
  exportLabel: {
    ...theme.typography.caption,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  periodChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  periodChipActive: {
    backgroundColor: theme.colors.ink,
    borderColor: theme.colors.ink,
  },
  periodChipLabel: {
    ...theme.typography.caption,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  periodChipLabelActive: {
    color: theme.colors.textOnInk,
  },
  categoryFilterWrapper: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  darkCard: {
    backgroundColor: theme.colors.ink,
    borderRadius: theme.radius.card,
    padding: theme.spacing.xl,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: theme.spacing.md,
  },
  metricBlock: {
    flex: 1,
    gap: 6,
  },
  metricDivider: {
    width: 1,
    backgroundColor: theme.colors.inkDivider,
    marginVertical: 2,
  },
  metricEyebrow: {
    ...theme.typography.micro,
    color: theme.colors.textMutedOnInk,
  },
  metricTotal: {
    ...theme.typography.title,
    ...theme.typography.tabularNums,
    fontSize: 24,
    lineHeight: 30,
    color: theme.colors.textOnInk,
  },
  metricAverage: {
    ...theme.typography.title,
    ...theme.typography.tabularNums,
    fontSize: 22,
    lineHeight: 30,
    color: theme.colors.accentSage,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: theme.spacing.md,
  },
  metaBadge: {
    backgroundColor: theme.colors.inkElevated,
    borderWidth: 1,
    borderColor: theme.colors.inkDivider,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metaBadgeText: {
    ...theme.typography.caption,
    ...theme.typography.tabularNums,
    fontSize: 12,
    color: theme.colors.textMutedOnInk,
  },
  metaCategoryBadge: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metaCategoryText: {
    ...theme.typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  chartSection: {
    marginTop: theme.spacing.xl,
  },
  chartTitle: {
    ...theme.typography.micro,
    color: theme.colors.textMutedOnInk,
    marginBottom: theme.spacing.sm,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.inkDivider,
    paddingBottom: 6,
  },
  barsRowScrollable: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.inkDivider,
    paddingBottom: 6,
    paddingRight: 8,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  barColumnScrollable: {
    flex: 0,
    width: 48,
  },
  barTrack: {
    width: '100%',
    height: CHART_MAX_HEIGHT + 22,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barValue: {
    ...theme.typography.tabularNums,
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textMutedOnInk,
  },
  barFill: {
    width: '78%',
    maxWidth: 36,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  barMonthLabel: {
    ...theme.typography.tabularNums,
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.textMutedOnInk,
    opacity: 0.72,
  },
  barMonthLabelActive: {
    color: theme.colors.textOnInk,
    fontWeight: '700',
    opacity: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.sectionTitle,
    color: theme.colors.textPrimary,
  },
  sectionSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  rankingList: {
    gap: 10,
  },
  rankingCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.item,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  rankingTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rankingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rankingIconBadge: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankingInfo: {
    flex: 1,
    gap: 2,
  },
  rankingName: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  rankingCount: {
    ...theme.typography.caption,
    ...theme.typography.tabularNums,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  rankingRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  rankingAmount: {
    ...theme.typography.body,
    ...theme.typography.tabularNums,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  rankingPercent: {
    ...theme.typography.caption,
    ...theme.typography.tabularNums,
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  rankingTrack: {
    width: '100%',
    height: 7,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceMuted,
    overflow: 'hidden',
  },
  rankingFill: {
    height: '100%',
    borderRadius: theme.radius.pill,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
    alignItems: 'center',
    gap: 8,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentPeriwinkle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  emptyText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
  },
});
