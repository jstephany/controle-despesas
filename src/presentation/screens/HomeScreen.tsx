import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getCategoryMetadata,
  type ExpenseCategory,
} from '@/domain/entities/Category';
import type { Expense } from '@/domain/entities/Expense';
import { formatCentsToBRL } from '@/domain/services/currency';
import { filterExpensesByCategory } from '@/domain/services/expenseCalculations';
import {
  formatMonthPeriodLabel,
  getCurrentMonthPeriod,
} from '@/domain/utils/dateUtils';

import { BudgetModal } from '../components/BudgetModal';
import { BudgetProgressSection } from '../components/BudgetProgressSection';
import { CategoryFilterBar } from '../components/CategoryFilterBar';
import { EmptyState } from '../components/EmptyState';
import { ExpenseItem } from '../components/ExpenseItem';
import { MonthlySummaryCard } from '../components/MonthlySummaryCard';
import { MonthSelector } from '../components/MonthSelector';
import { useExpenses } from '../hooks/useExpenses';
import { theme } from '../theme/theme';

const TRANSITION_SHIFT_PX = 28;

export function HomeScreen() {
  const {
    selectedPeriod,
    expenses,
    monthlyTotalCents,
    categoryBreakdown,
    monthlyBudget,
    budgetEvaluation,
    isInitializing,
    isLoading,
    error,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
    deleteExpense,
    saveMonthlyBudget,
    removeMonthlyBudget,
    refresh,
  } = useExpenses();

  const [selectedChartCategory, setSelectedChartCategory] =
    useState<ExpenseCategory | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<ExpenseCategory | null>(null);
  const [isBudgetModalVisible, setIsBudgetModalVisible] = useState(false);

  const [translateX] = useState(() => new Animated.Value(0));
  const [opacity] = useState(() => new Animated.Value(1));

  const animateMonthTransition = useCallback(
    (direction: 1 | -1, applyPeriodChange: () => void) => {
      translateX.stopAnimation();
      opacity.stopAnimation();

      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -TRANSITION_SHIFT_PX * direction,
          duration: 100,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.2,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setSelectedChartCategory(null);
        applyPeriodChange();

        translateX.setValue(TRANSITION_SHIFT_PX * direction);

        Animated.parallel([
          Animated.timing(translateX, {
            toValue: 0,
            duration: 190,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 190,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [opacity, translateX]
  );

  const handlePreviousMonth = useCallback(() => {
    animateMonthTransition(-1, goToPreviousMonth);
  }, [animateMonthTransition, goToPreviousMonth]);

  const handleNextMonth = useCallback(() => {
    animateMonthTransition(1, goToNextMonth);
  }, [animateMonthTransition, goToNextMonth]);

  const handleCurrentMonth = useCallback(() => {
    const current = getCurrentMonthPeriod();
    const isForward =
      current.year > selectedPeriod.year ||
      (current.year === selectedPeriod.year &&
        current.month >= selectedPeriod.month);
    animateMonthTransition(isForward ? 1 : -1, goToCurrentMonth);
  }, [animateMonthTransition, goToCurrentMonth, selectedPeriod]);

  const visibleExpenses = useMemo(
    () => filterExpensesByCategory(expenses, selectedCategoryFilter),
    [expenses, selectedCategoryFilter]
  );

  const handleOpenNewExpense = useCallback(() => {
    router.push('/new-expense');
  }, []);

  const handleEditExpense = useCallback((expense: Expense) => {
    router.push({
      pathname: '/new-expense',
      params: { expenseId: expense.id },
    });
  }, []);

  const handleConfirmDelete = useCallback(
    (expense: Expense) => {
      const formattedAmount = formatCentsToBRL(expense.amountCents);
      const message = `Deseja excluir "${expense.description}" (${formattedAmount})? O total do mês será recalculado imediatamente.`;

      const executeDelete = () => {
        void deleteExpense(expense.id).catch(() => {
          Alert.alert(
            'Erro ao excluir',
            'Não foi possível remover a despesa. Tente novamente.'
          );
        });
      };

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.confirm(message)) {
          executeDelete();
        }
        return;
      }

      Alert.alert('Excluir despesa', message, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: executeDelete,
        },
      ]);
    },
    [deleteExpense]
  );

  const handleSaveBudget = useCallback(
    async (limitCents: number) => {
      await saveMonthlyBudget(limitCents);
    },
    [saveMonthlyBudget]
  );

  const handleRemoveBudget = useCallback(async () => {
    await removeMonthlyBudget();
  }, [removeMonthlyBudget]);

  const monthLabel = formatMonthPeriodLabel(selectedPeriod);
  const filteredCategoryLabel = selectedCategoryFilter
    ? getCategoryMetadata(selectedCategoryFilter).label
    : null;

  const animatedMonthStyle = {
    opacity,
    transform: [{ translateX }],
  };

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <Animated.View style={animatedMonthStyle}>
        <MonthlySummaryCard
          totalCents={monthlyTotalCents}
          expenseCount={expenses.length}
          categoryBreakdown={categoryBreakdown}
          selectedCategory={selectedChartCategory}
          onSelectCategory={setSelectedChartCategory}
        />

        <BudgetProgressSection
          evaluation={budgetEvaluation}
          onPressConfigure={() => setIsBudgetModalVisible(true)}
        />
      </Animated.View>

      {error ? (
        <View style={styles.errorBanner} accessibilityRole="alert">
          <Feather name="alert-circle" size={16} color={theme.colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void refresh()} hitSlop={8}>
            <Text style={styles.retryText}>Tentar</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Lançamentos</Text>
        <Text style={styles.sectionSubtitle}>
          {selectedCategoryFilter
            ? `${visibleExpenses.length} em ${filteredCategoryLabel}`
            : expenses.length > 0
              ? 'Toque para editar'
              : 'Período selecionado'}
        </Text>
      </View>

      <View style={styles.filterBarWrapper}>
        <CategoryFilterBar
          selectedCategory={selectedCategoryFilter}
          onSelectCategory={setSelectedCategoryFilter}
        />
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (isInitializing || isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.ink} />
          <Text style={styles.loadingText}>Carregando despesas...</Text>
        </View>
      );
    }

    if (selectedCategoryFilter && expenses.length > 0) {
      return (
        <View style={styles.filteredEmptyCard}>
          <Text style={styles.filteredEmptyTitle}>
            Sem gastos em {filteredCategoryLabel} neste mês
          </Text>
          <Text style={styles.filteredEmptySubtitle}>
            O resumo acima continua exibindo todos os lançamentos do período.
          </Text>
          <Pressable
            onPress={() => setSelectedCategoryFilter(null)}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.clearFilterButton,
              pressed && styles.clearFilterButtonPressed,
            ]}
          >
            <Text style={styles.clearFilterLabel}>Ver todas as categorias</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <Animated.View style={{ opacity }}>
        <EmptyState
          monthLabel={monthLabel}
          onAddPress={handleOpenNewExpense}
        />
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.topHeader}>
          <View>
            <View style={styles.offlineBadge}>
              <View style={styles.offlineDot} />
              <Text style={styles.offlineText}>Offline-first</Text>
            </View>
            <Text style={styles.title}>Minhas Despesas</Text>
          </View>

          <Pressable
            onPress={handleOpenNewExpense}
            accessibilityRole="button"
            accessibilityLabel="Nova despesa"
            style={({ pressed }) => [
              styles.headerAddButton,
              pressed && styles.headerAddButtonPressed,
            ]}
          >
            <Feather name="plus" size={20} color={theme.colors.textOnInk} />
          </Pressable>
        </View>

        <View style={styles.selectorWrapper}>
          <MonthSelector
            period={selectedPeriod}
            onPrevious={handlePreviousMonth}
            onNext={handleNextMonth}
            onResetToCurrent={handleCurrentMonth}
          />
        </View>

        <FlatList
          data={visibleExpenses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExpenseItem
              expense={item}
              onPress={handleEditExpense}
              onRequestDelete={handleConfirmDelete}
            />
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        <BudgetModal
          visible={isBudgetModalVisible}
          monthLabel={monthLabel}
          currentBudget={monthlyBudget}
          onClose={() => setIsBudgetModalVisible(false)}
          onSave={handleSaveBudget}
          onRemove={handleRemoveBudget}
        />
      </View>
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  offlineDot: {
    width: 7,
    height: 7,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentSage,
  },
  offlineText: {
    ...theme.typography.micro,
    color: theme.colors.textSecondary,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
  },
  headerAddButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAddButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
  selectorWrapper: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  listContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 124,
  },
  listHeader: {
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.sectionTitle,
    color: theme.colors.textPrimary,
  },
  sectionSubtitle: {
    ...theme.typography.caption,
    ...theme.typography.tabularNums,
    color: theme.colors.textSecondary,
  },
  filterBarWrapper: {
    marginTop: theme.spacing.md,
  },
  itemSeparator: {
    height: 10,
  },
  loadingContainer: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    paddingVertical: theme.spacing.xxl,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  loadingText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  filteredEmptyCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    gap: 8,
  },
  filteredEmptyTitle: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  filteredEmptySubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  clearFilterButton: {
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.ink,
  },
  clearFilterButtonPressed: {
    opacity: 0.85,
  },
  clearFilterLabel: {
    ...theme.typography.caption,
    fontWeight: '700',
    color: theme.colors.textOnInk,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.dangerSurface,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: theme.spacing.md,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.danger,
    flex: 1,
  },
  retryText: {
    ...theme.typography.caption,
    fontWeight: '700',
    color: theme.colors.danger,
    textDecorationLine: 'underline',
  },
});
