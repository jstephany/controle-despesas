import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme/theme';

interface EmptyStateProps {
  readonly monthLabel: string;
  readonly onAddPress: () => void;
}

export function EmptyState({ monthLabel, onAddPress }: EmptyStateProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Feather name="feather" size={22} color={theme.colors.textPrimary} />
      </View>

      <Text style={styles.title}>Nenhuma despesa em {monthLabel}</Text>
      <Text style={styles.subtitle}>
        Seus registros ficam salvos localmente no aparelho e funcionam 100% sem
        internet.
      </Text>

      <Pressable
        onPress={onAddPress}
        accessibilityRole="button"
        accessibilityLabel="Adicionar primeira despesa"
        style={({ pressed }) => [
          styles.ctaButton,
          pressed && styles.ctaButtonPressed,
        ]}
      >
        <Feather name="plus" size={16} color={theme.colors.textOnInk} />
        <Text style={styles.ctaLabel}>Adicionar primeira despesa</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentSage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.sectionTitle,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.captionRegular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
    lineHeight: 19,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.ink,
    borderRadius: theme.radius.md,
    paddingHorizontal: 20,
    paddingVertical: 13,
    marginTop: theme.spacing.xl,
  },
  ctaButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  ctaLabel: {
    ...theme.typography.bodyBold,
    color: theme.colors.textOnInk,
  },
});
