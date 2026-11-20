import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from '@/domain/entities/Category';

import { getCategoryVisual, theme } from '../theme/theme';

interface CategoryPickerProps {
  readonly selectedCategory: ExpenseCategory | '';
  readonly onSelect: (category: ExpenseCategory) => void;
}

export function CategoryPicker({
  selectedCategory,
  onSelect,
}: CategoryPickerProps) {
  return (
    <View style={styles.container}>
      {EXPENSE_CATEGORIES.map((category) => {
        const isActive = selectedCategory === category.id;
        const visual = getCategoryVisual(category.id);

        return (
          <Pressable
            key={category.id}
            onPress={() => onSelect(category.id)}
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
              size={14}
              color={theme.colors.textPrimary}
            />
            <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>
              {category.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  chipPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  chipLabel: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
  },
  chipLabelActive: {
    fontFamily: theme.fonts.sansBold,
  },
});
