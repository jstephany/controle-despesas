import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ExpenseCategory } from '@/domain/entities/Category';
import {
  MAX_DESCRIPTION_LENGTH,
  validateExpenseInput,
  type ExpenseValidationErrors,
} from '@/domain/services/expenseValidation';
import {
  formatIsoDateToBR,
  getRelativeIsoDate,
  getTodayIsoDate,
} from '@/domain/utils/dateUtils';

import { CategoryPicker } from '../components/CategoryPicker';
import { FormFieldError } from '../components/FormFieldError';
import { useExpenses } from '../hooks/useExpenses';
import { theme } from '../theme/theme';

function formatTypingDateBR(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function NewExpenseScreen() {
  const { addExpense } = useExpenses();

  const todayBR = formatIsoDateToBR(getTodayIsoDate());
  const yesterdayBR = formatIsoDateToBR(getRelativeIsoDate(-1));

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayBR);
  const [category, setCategory] = useState<ExpenseCategory>('alimentacao');
  const [errors, setErrors] = useState<ExpenseValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearFieldError = (field: keyof ExpenseValidationErrors) => {
    setErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    clearFieldError('amount');
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    clearFieldError('description');
  };

  const handleDateChange = (value: string) => {
    const formatted =
      value.length < date.length ? value : formatTypingDateBR(value);
    setDate(formatted);
    clearFieldError('date');
  };

  const handleSelectDateShortcut = (targetDateBR: string) => {
    setDate(targetDateBR);
    clearFieldError('date');
  };

  const handleSelectCategory = (selected: ExpenseCategory) => {
    setCategory(selected);
    clearFieldError('category');
  };

  const handleSubmit = async () => {
    const validation = validateExpenseInput({
      description,
      amount,
      date,
      category,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await addExpense(validation.data);
      router.back();
    } catch (err) {
      Alert.alert(
        'Erro ao salvar',
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar a despesa localmente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <Feather name="arrow-left" size={18} color={theme.colors.textPrimary} />
          </Pressable>

          <Text style={styles.headerTitle}>Nova despesa</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Valor</Text>
            <View
              style={[
                styles.amountCard,
                errors.amount ? styles.inputErrorBorder : null,
              ]}
            >
              <Text style={styles.currencyPrefix}>R$</Text>
              <TextInput
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0,00"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="decimal-pad"
                returnKeyType="next"
                style={styles.amountInput}
                accessibilityLabel="Valor da despesa em reais"
              />
            </View>
            <FormFieldError message={errors.amount} />
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Descrição</Text>
              <Text style={styles.charCount}>
                {description.trim().length}/{MAX_DESCRIPTION_LENGTH}
              </Text>
            </View>
            <TextInput
              value={description}
              onChangeText={handleDescriptionChange}
              placeholder="Ex.: Supermercado, Almoço, Uber..."
              placeholderTextColor={theme.colors.textSecondary}
              maxLength={MAX_DESCRIPTION_LENGTH}
              returnKeyType="done"
              style={[
                styles.textInput,
                errors.description ? styles.inputErrorBorder : null,
              ]}
              accessibilityLabel="Descrição da despesa"
            />
            <FormFieldError message={errors.description} />
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Data</Text>
              <View style={styles.shortcutsRow}>
                <Pressable
                  onPress={() => handleSelectDateShortcut(todayBR)}
                  style={[
                    styles.shortcutPill,
                    date === todayBR && styles.shortcutPillActive,
                  ]}
                >
                  <Text style={styles.shortcutText}>Hoje</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleSelectDateShortcut(yesterdayBR)}
                  style={[
                    styles.shortcutPill,
                    date === yesterdayBR && styles.shortcutPillActive,
                  ]}
                >
                  <Text style={styles.shortcutText}>Ontem</Text>
                </Pressable>
              </View>
            </View>
            <View
              style={[
                styles.dateInputRow,
                errors.date ? styles.inputErrorBorder : null,
              ]}
            >
              <Feather
                name="calendar"
                size={16}
                color={theme.colors.textSecondary}
              />
              <TextInput
                value={date}
                onChangeText={handleDateChange}
                placeholder="DD/MM/AAAA"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                style={styles.dateInput}
                accessibilityLabel="Data da despesa no formato DD/MM/AAAA"
              />
            </View>
            <FormFieldError message={errors.date} />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Categoria</Text>
            <CategoryPicker
              selectedCategory={category}
              onSelect={handleSelectCategory}
            />
            <FormFieldError message={errors.category} />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={() => void handleSubmit()}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Salvar despesa"
            style={({ pressed }) => [
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
              pressed && !isSubmitting && styles.submitButtonPressed,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={theme.colors.textOnInk} />
            ) : (
              <>
                <Feather name="check" size={18} color={theme.colors.textOnInk} />
                <Text style={styles.submitLabel}>Salvar despesa</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.95 }],
  },
  headerTitle: {
    ...theme.typography.sectionTitle,
    fontSize: 20,
    color: theme.colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.xl,
  },
  fieldGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...theme.typography.caption,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.1,
  },
  charCount: {
    ...theme.typography.caption,
    ...theme.typography.tabularNums,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  amountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1.25,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 10,
  },
  currencyPrefix: {
    ...theme.typography.title,
    fontSize: 22,
    color: theme.colors.textSecondary,
  },
  amountInput: {
    ...theme.typography.display,
    ...theme.typography.tabularNums,
    fontSize: 32,
    lineHeight: 38,
    color: theme.colors.textPrimary,
    flex: 1,
    padding: 0,
  },
  textInput: {
    ...theme.typography.body,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.25,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: theme.colors.textPrimary,
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  shortcutPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  shortcutPillActive: {
    backgroundColor: theme.colors.accentMustard,
  },
  shortcutText: {
    ...theme.typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.25,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  dateInput: {
    ...theme.typography.body,
    ...theme.typography.tabularNums,
    color: theme.colors.textPrimary,
    flex: 1,
    padding: 0,
  },
  inputErrorBorder: {
    borderColor: theme.colors.danger,
  },
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.canvas,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.ink,
    borderRadius: theme.radius.pill,
    paddingVertical: 16,
  },
  submitButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitLabel: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.textOnInk,
  },
});
