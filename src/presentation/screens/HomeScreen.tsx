import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Expense } from '@/domain/entities/Expense';
import { formatCentsToBRL } from '@/domain/services/currency';
import { formatMonthPeriodLabel } from '@/domain/utils/dateUtils';

import { EmptyState } from '../components/EmptyState';
import { ExpenseItem } from '../components/ExpenseItem';
import { MonthlySummaryCard } from '../components/MonthlySummaryCard';
import { MonthSelector } from '../components/MonthSelector';
import { useExpenses } from '../hooks/useExpenses';
import { theme } from '../theme/theme';

export function HomeScreen() {
  const {
    selectedPeriod,
    expenses,
    monthlyTotalCents,
    categoryBreakdown,
    isInitializing,
    isLoading,
    error,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
    deleteExpense,
    refresh,
  } = useExpenses();

  const handleOpenNewExpense = useCallback(() => {
    router.push('/new-expense');
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

  const monthLabel = formatMonthPeriodLabel(selectedPeriod);

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <MonthlySummaryCard
        totalCents={monthlyTotalCents}
        expenseCount={expenses.length}
        categoryBreakdown={categoryBreakdown}
      />

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
          {expenses.length > 0 ? 'Mais recentes primeiro' : 'Período selecionado'}
        </Text>
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

    return (
      <EmptyState
        monthLabel={monthLabel}
        onAddPress={handleOpenNewExpense}
      />
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
            onPrevious={goToPreviousMonth}
            onNext={goToNextMonth}
            onResetToCurrent={goToCurrentMonth}
          />
        </View>

        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExpenseItem
              expense={item}
              onRequestDelete={handleConfirmDelete}
            />
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {expenses.length > 0 ? (
          <View style={styles.fabContainer} pointerEvents="box-none">
            <Pressable
              onPress={handleOpenNewExpense}
              accessibilityRole="button"
              accessibilityLabel="Registrar nova despesa"
              style={({ pressed }) => [
                styles.fabButton,
                pressed && styles.fabButtonPressed,
              ]}
            >
              <Feather name="plus" size={18} color={theme.colors.textOnInk} />
              <Text style={styles.fabLabel}>Nova despesa</Text>
            </Pressable>
          </View>
        ) : null}
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
    paddingBottom: 108,
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
    color: theme.colors.textSecondary,
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
  fabContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: 'center',
  },
  fabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.ink,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 22,
    paddingVertical: 14,
    shadowColor: '#161615',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  fabButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  fabLabel: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.textOnInk,
  },
});
