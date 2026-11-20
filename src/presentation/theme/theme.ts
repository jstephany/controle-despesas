import type { ComponentProps } from 'react';
import type { TextStyle } from 'react-native';
import type { Feather } from '@expo/vector-icons';

import type { ExpenseCategory } from '@/domain/entities/Category';

export type FeatherIconName = ComponentProps<typeof Feather>['name'];

export interface CategoryVisual {
  readonly fill: string;
  readonly icon: FeatherIconName;
  readonly shortLabel: string;
}

export const fonts = {
  sansRegular: 'SpaceGrotesk_400Regular',
  sansMedium: 'SpaceGrotesk_500Medium',
  sansBold: 'SpaceGrotesk_700Bold',
} as const;

export const theme = {
  fonts,
  colors: {
    canvas: '#F6F3EB',
    surface: '#FAF8F3',
    surfaceMuted: '#EFECE2',
    border: '#D7D1C2',
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
    sm: 6,
    md: 8,
    item: 10,
    card: 10,
    pill: 999,
  },
  typography: {
    tabularNums: {
      fontVariant: ['tabular-nums'],
    } as TextStyle,
    display: {
      fontFamily: fonts.sansBold,
      fontSize: 32,
      lineHeight: 38,
      letterSpacing: -0.9,
    } as TextStyle,
    title: {
      fontFamily: fonts.sansBold,
      fontSize: 28,
      lineHeight: 34,
      letterSpacing: -0.7,
    } as TextStyle,
    sectionTitle: {
      fontFamily: fonts.sansBold,
      fontSize: 18,
      lineHeight: 24,
      letterSpacing: -0.3,
    } as TextStyle,
    body: {
      fontFamily: fonts.sansMedium,
      fontSize: 15,
      lineHeight: 21,
    } as TextStyle,
    bodyBold: {
      fontFamily: fonts.sansBold,
      fontSize: 15,
      lineHeight: 21,
      letterSpacing: -0.2,
    } as TextStyle,
    caption: {
      fontFamily: fonts.sansMedium,
      fontSize: 13,
      lineHeight: 18,
    } as TextStyle,
    captionRegular: {
      fontFamily: fonts.sansRegular,
      fontSize: 13,
      lineHeight: 18,
    } as TextStyle,
    micro: {
      fontFamily: fonts.sansBold,
      fontSize: 11,
      lineHeight: 14,
      letterSpacing: 1.0,
      textTransform: 'uppercase',
    } as TextStyle,
    numericDisplay: {
      fontFamily: fonts.sansBold,
      fontSize: 28,
      lineHeight: 34,
      letterSpacing: -0.8,
      fontVariant: ['tabular-nums'],
    } as TextStyle,
    numericTitle: {
      fontFamily: fonts.sansBold,
      fontSize: 22,
      lineHeight: 28,
      letterSpacing: -0.5,
      fontVariant: ['tabular-nums'],
    } as TextStyle,
    numericBody: {
      fontFamily: fonts.sansBold,
      fontSize: 15,
      lineHeight: 20,
      letterSpacing: -0.2,
      fontVariant: ['tabular-nums'],
    } as TextStyle,
    numericCaption: {
      fontFamily: fonts.sansMedium,
      fontSize: 12.5,
      lineHeight: 17,
      fontVariant: ['tabular-nums'],
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
