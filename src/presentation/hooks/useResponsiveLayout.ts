import { useWindowDimensions } from 'react-native';

export interface ResponsiveLayout {
  readonly width: number;
  readonly isCompact: boolean;
  readonly isTablet: boolean;
  readonly maxContentWidth: number;
  readonly horizontalPadding: number;
  readonly contentWidth: number;
  readonly donutSize: number;
  readonly donutStrokeWidth: number;
  readonly barChartMaxHeight: number;
  readonly barMaxWidth: number;
  readonly barScrollColumnWidth: number;
  readonly modalMaxWidth: number;
  readonly tabBarMaxWidth: number;
  readonly tabBarHorizontalInset: number;
}

const MAX_CONTENT_WIDTH = 680;
const MODAL_MAX_WIDTH = 460;

export function useResponsiveLayout(): ResponsiveLayout {
  const { width } = useWindowDimensions();

  const isCompact = width < 380;
  const isTablet = width >= 600;
  const horizontalPadding = isTablet ? 28 : isCompact ? 14 : 20;
  const effectiveContainerWidth = Math.min(width, MAX_CONTENT_WIDTH);
  const contentWidth = Math.max(
    280,
    effectiveContainerWidth - horizontalPadding * 2
  );

  // Proportional ring diameter clamped safely for 360px phones up to tablets
  const donutSize = Math.max(198, Math.min(268, Math.round(contentWidth - 96)));
  const donutStrokeWidth = isCompact ? 26 : 30;

  return {
    width,
    isCompact,
    isTablet,
    maxContentWidth: MAX_CONTENT_WIDTH,
    horizontalPadding,
    contentWidth,
    donutSize,
    donutStrokeWidth,
    barChartMaxHeight: isCompact ? 78 : isTablet ? 108 : 92,
    barMaxWidth: isTablet ? 44 : isCompact ? 30 : 36,
    barScrollColumnWidth: isCompact ? 42 : isTablet ? 56 : 48,
    modalMaxWidth: MODAL_MAX_WIDTH,
    tabBarMaxWidth: isTablet ? 420 : 380,
    tabBarHorizontalInset: isCompact ? 14 : 24,
  };
}
