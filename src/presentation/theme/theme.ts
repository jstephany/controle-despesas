import type { ComponentProps } from 'react';
import { Platform, type TextStyle } from 'react-native';
import type { Feather } from '@expo/vector-icons';

import type { ExpenseCategory } from '@/domain/entities/Category';

export type FeatherIconName = ComponentProps<typeof Feather>['name'];

export interface CategoryVisual {
  readonly fill: string;
  readonly icon: FeatherIconName;
  readonly shortLabel: string;
}

const FONT_FAMILY = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const theme = {
  colors: {
    canvas: '#F6F3EB',
    surface: '#FAF8F3',
    surfaceMuted: '#EFECE2',
    border: '#E2DDD0',
    borderStrong: '#181816',
    ink: '#161615',
    inkElevated: '#242321',
    inkDivider: '#2F2E2B',
    inkEmptyBar: '#2B2A28',
    textPrimary: '#181816',
    textSecondary: '#5E5C55',
    textOnInk: '#F6F3EB',
    textMutedOnInk: '#ABA79C',
    danger: '#C84B31',
    dangerSurface: '#F9E6E1',
    accentSage: '#A3BC7E',
    accentMustard: '#F2D46F',
    accentPeriwinkle: '#96ACF4',
    accentPink: '#EAB5D8',
    accentTerracotta: '#E89A78',
    accentSeafoam: '#8BB5A8',
    accentSand: '#D8D1C0',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
  },
  radius: {
    sm: 10,
    md: 16,
    item: 18,
    card: 24,
    pill: 999,
  },
  typography: {
    fontFamily: FONT_FAMILY,
    tabularNums: {
      fontVariant: ['tabular-nums'],
    } as TextStyle,
    display: {
      fontFamily: FONT_FAMILY,
      fontSize: 34,
      lineHeight: 40,
      fontWeight: '700',
      letterSpacing: -1.1,
    } as TextStyle,
    title: {
      fontFamily: FONT_FAMILY,
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '700',
      letterSpacing: -0.7,
    } as TextStyle,
    sectionTitle: {
      fontFamily: FONT_FAMILY,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '700',
      letterSpacing: -0.3,
    } as TextStyle,
    body: {
      fontFamily: FONT_FAMILY,
      fontSize: 15,
      lineHeight: 21,
      fontWeight: '500',
    } as TextStyle,
    caption: {
      fontFamily: FONT_FAMILY,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500',
    } as TextStyle,
    micro: {
      fontFamily: FONT_FAMILY,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '700',
      letterSpacing: 0.9,
      textTransform: 'uppercase',
    } as TextStyle,
  },
  categories: {
    alimentacao: {
      fill: '#A3BC7E',
      icon: 'coffee',
      shortLabel: 'Alim',
    },
    transporte: {
      fill: '#96ACF4',
      icon: 'navigation',
      shortLabel: 'Tran',
    },
    moradia: {
      fill: '#E89A78',
      icon: 'home',
      shortLabel: 'Mora',
    },
    saude: {
      fill: '#EAB5D8',
      icon: 'heart',
      shortLabel: 'Saúd',
    },
    lazer: {
      fill: '#F2D46F',
      icon: 'sun',
      shortLabel: 'Laze',
    },
    educacao: {
      fill: '#8BB5A8',
      icon: 'book-open',
      shortLabel: 'Educ',
    },
    outros: {
      fill: '#D8D1C0',
      icon: 'tag',
      shortLabel: 'Outr',
    },
  } satisfies Record<ExpenseCategory, CategoryVisual>,
} as const;

export function getCategoryVisual(category: ExpenseCategory): CategoryVisual {
  return theme.categories[category] ?? theme.categories.outros;
}
