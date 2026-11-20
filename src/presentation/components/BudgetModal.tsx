import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { MonthlyBudget } from '@/domain/entities/Budget';
import { validateBudgetInput } from '@/domain/services/budgetService';
import { formatCentsToInputValue } from '@/domain/services/currency';

import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { theme } from '../theme/theme';
import { FormFieldError } from './FormFieldError';

interface BudgetModalProps {
  readonly visible: boolean;
  readonly monthLabel: string;
  readonly currentBudget: MonthlyBudget | null;
  readonly onClose: () => void;
  readonly onSave: (limitCents: number) => Promise<void>;
  readonly onRemove: () => Promise<void>;
}

interface BudgetModalFormProps {
  readonly monthLabel: string;
  readonly currentBudget: MonthlyBudget | null;
  readonly onClose: () => void;
  readonly onSave: (limitCents: number) => Promise<void>;
  readonly onRemove: () => Promise<void>;
}

function BudgetModalForm({
  monthLabel,
  currentBudget,
  onClose,
  onSave,
  onRemove,
}: BudgetModalFormProps) {
  const { modalMaxWidth } = useResponsiveLayout();
  const [amount, setAmount] = useState(() =>
    currentBudget ? formatCentsToInputValue(currentBudget.limitCents) : ''
  );
  const [error, setError] = useState<string | undefined>(undefined);
  const [isBusy, setIsBusy] = useState(false);

  const handleSave = async () => {
    const validation = validateBudgetInput(amount);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setError(undefined);
    setIsBusy(true);
    try {
      await onSave(validation.limitCents);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar o orçamento.'
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleRemove = async () => {
    setIsBusy(true);
    try {
      await onRemove();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível remover o orçamento.'
      );
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <View style={[styles.sheet, { maxWidth: modalMaxWidth }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {currentBudget ? 'Editar orçamento' : 'Definir orçamento'}
          </Text>
          <Text style={styles.subtitle}>{monthLabel}</Text>
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Fechar modal de orçamento"
          style={styles.closeButton}
        >
          <Feather name="x" size={18} color={theme.colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Limite mensal</Text>
        <View
          style={[styles.amountRow, error ? styles.amountRowError : null]}
        >
          <Text style={styles.currencyPrefix}>R$</Text>
          <TextInput
            value={amount}
            onChangeText={(text) => {
              setAmount(text);
              if (error) setError(undefined);
            }}
            placeholder="0,00"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="decimal-pad"
            autoFocus
            style={styles.amountInput}
            accessibilityLabel="Valor do orçamento mensal em reais"
          />
        </View>
        <FormFieldError message={error} />
      </View>

      <Pressable
        onPress={() => void handleSave()}
        disabled={isBusy}
        accessibilityRole="button"
        accessibilityLabel="Salvar orçamento"
        style={({ pressed }) => [
          styles.primaryButton,
          isBusy && styles.buttonDisabled,
          pressed && !isBusy && styles.buttonPressed,
        ]}
      >
        {isBusy ? (
          <ActivityIndicator size="small" color={theme.colors.textOnInk} />
        ) : (
          <Text style={styles.primaryButtonText}>Salvar orçamento</Text>
        )}
      </Pressable>

      <View style={styles.secondaryActions}>
        <Pressable
          onPress={onClose}
          disabled={isBusy}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.secondaryButtonText}>Cancelar</Text>
        </Pressable>

        {currentBudget ? (
          <Pressable
            onPress={() => void handleRemove()}
            disabled={isBusy}
            accessibilityRole="button"
            accessibilityLabel="Remover orçamento"
            style={({ pressed }) => [
              styles.removeButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Feather name="trash-2" size={14} color={theme.colors.danger} />
            <Text style={styles.removeButtonText}>Remover limite</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function BudgetModal({
  visible,
  monthLabel,
  currentBudget,
  onClose,
  onSave,
  onRemove,
}: BudgetModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        {visible ? (
          <BudgetModalForm
            monthLabel={monthLabel}
            currentBudget={currentBudget}
            onClose={onClose}
            onSave={onSave}
            onRemove={onRemove}
          />
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(22, 22, 21, 0.48)',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  sheet: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.card,
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...theme.typography.sectionTitle,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    ...theme.typography.numericCaption,
    color: theme.colors.textSecondary,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    ...theme.typography.micro,
    color: theme.colors.textPrimary,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.canvas,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  amountRowError: {
    borderColor: theme.colors.danger,
  },
  currencyPrefix: {
    ...theme.typography.numericTitle,
    fontSize: 18,
    color: theme.colors.textSecondary,
  },
  amountInput: {
    ...theme.typography.numericDisplay,
    fontSize: 28,
    lineHeight: 34,
    color: theme.colors.textPrimary,
    flex: 1,
    padding: 0,
  },
  primaryButton: {
    backgroundColor: theme.colors.ink,
    borderRadius: theme.radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.textOnInk,
  },
  secondaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  secondaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.dangerSurface,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  removeButtonText: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.sansBold,
    color: theme.colors.danger,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
