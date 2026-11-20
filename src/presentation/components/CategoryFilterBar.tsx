import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from '@/domain/entities/Category';

import { getCategoryVisual, theme } from '../theme/theme';

interface CategoryFilterBarProps {
  readonly selectedCategory: ExpenseCategory | null;
  readonly onSelectCategory: (category: ExpenseCategory | null) => void;
}

export function CategoryFilterBar({
  selectedCategory,
  onSelectCategory,
}: CategoryFilterBarProps) {
  const isAllActive = selectedCategory === null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      <Pressable
        onPress={() => onSelectCategory(null)}
        accessibilityRole="button"
        accessibilityState={{ selected: isAllActive }}
        style={({ pressed }) => [
          styles.chip,
          isAllActive && styles.allChipActive,
          pressed && styles.chipPressed,
        ]}
      >
        <Text
          style={[styles.chipLabel, isAllActive && styles.allChipLabelActive]}
        >
          Todas
        </Text>
      </Pressable>

      {EXPENSE_CATEGORIES.map((category) => {
        const isActive = selectedCategory === category.id;
        const visual = getCategoryVisual(category.id);

        return (
          <Pressable
            key={category.id}
            onPress={() =>
              onSelectCategory(isActive ? null : category.id)
            }
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            style={({ pressed }) => [
              styles.chip,
              isActive && {
                backgroundColor: visual.fill,
                borderColor: theme.colors.borderStrong,
              },
              pressed && styles.chipPressed,
            ]}
          >
            <Feather
              name={visual.icon}
              size={13}
              color={theme.colors.textPrimary}
            />
            <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>
              {category.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  allChipActive: {
    backgroundColor: theme.colors.ink,
    borderColor: theme.colors.ink,
  },
  chipPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  chipLabel: {
    ...theme.typography.caption,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  chipLabelActive: {
    fontWeight: '700',
  },
  allChipLabelActive: {
    fontWeight: '700',
    color: theme.colors.textOnInk,
  },
});
