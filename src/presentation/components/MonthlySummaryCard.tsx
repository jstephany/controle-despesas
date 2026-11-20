import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import {
  getCategoryMetadata,
  type ExpenseCategory,
} from '@/domain/entities/Category';
import { formatCentsToBRL } from '@/domain/services/currency';
import type { CategoryBreakdownItem } from '@/domain/services/expenseCalculations';

import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { getCategoryVisual, theme } from '../theme/theme';

interface MonthlySummaryCardProps {
  readonly totalCents: number;
  readonly expenseCount: number;
  readonly categoryBreakdown: readonly CategoryBreakdownItem[];
  readonly selectedCategory: ExpenseCategory | null;
  readonly onSelectCategory: (category: ExpenseCategory | null) => void;
}

interface RingSegment {
  readonly item: CategoryBreakdownItem;
  readonly startAngle: number;
  readonly endAngle: number;
  readonly midAngle: number;
  readonly pathData: string;
  readonly iconX: number;
  readonly iconY: number;
}

const VISUAL_GAP_PX = 8;
const ICON_HIT_SIZE = 30;
const START_ANGLE_DEG = -90;

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const safeEnd = endAngle - startAngle < 0.5 ? startAngle + 0.5 : endAngle;
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, safeEnd);
  const largeArcFlag = safeEnd - startAngle > 180 ? 1 : 0;

  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

function buildRingSegments(
  activeItems: readonly CategoryBreakdownItem[],
  center: number,
  radius: number,
  strokeWidth: number
): RingSegment[] {
  const count = activeItems.length;
  if (count === 0) {
    return [];
  }

  const grandTotal = activeItems.reduce((sum, item) => sum + item.totalCents, 0);
  if (grandTotal <= 0) {
    return [];
  }

  if (count === 1) {
    const iconPos = polarToCartesian(center, center, radius, START_ANGLE_DEG);
    return [
      {
        item: activeItems[0],
        startAngle: START_ANGLE_DEG,
        endAngle: START_ANGLE_DEG + 360,
        midAngle: START_ANGLE_DEG,
        pathData: '',
        iconX: iconPos.x,
        iconY: iconPos.y,
      },
    ];
  }

  const gapAngleDeg = ((strokeWidth + VISUAL_GAP_PX) / radius) * (180 / Math.PI);
  const availableSweep = Math.max(360 - count * gapAngleDeg, count * 0.5);

  let cursor = START_ANGLE_DEG;

  return activeItems.map((item) => {
    const proportionalSweep = (item.totalCents / grandTotal) * availableSweep;
    const sweep = Math.max(proportionalSweep, 0.5);
    const startAngle = cursor;
    const endAngle = cursor + sweep;
    const midAngle = startAngle + sweep / 2;
    const iconPos = polarToCartesian(center, center, radius, midAngle);

    cursor = endAngle + gapAngleDeg;

    return {
      item,
      startAngle,
      endAngle,
      midAngle,
      pathData: describeArc(center, center, radius, startAngle, endAngle),
      iconX: iconPos.x,
      iconY: iconPos.y,
    };
  });
}

export function MonthlySummaryCard({
  totalCents,
  expenseCount,
  categoryBreakdown,
  selectedCategory,
  onSelectCategory,
}: MonthlySummaryCardProps) {
  const { donutSize, donutStrokeWidth, isCompact } = useResponsiveLayout();
  const center = donutSize / 2;
  const radius = Math.max(60, Math.round(center - donutStrokeWidth / 2 - 10));
  const innerContentWidth = Math.max(
    112,
    Math.round((radius - donutStrokeWidth / 2) * 1.75)
  );

  const activeItems = categoryBreakdown.filter((item) => item.totalCents > 0);
  const segments = buildRingSegments(
    activeItems,
    center,
    radius,
    donutStrokeWidth
  );

  const selectedItem =
    selectedCategory !== null
      ? activeItems.find((item) => item.category === selectedCategory) ?? null
      : null;

  const selectedMeta = selectedItem
    ? getCategoryMetadata(selectedItem.category)
    : null;
  const selectedVisual = selectedItem
    ? getCategoryVisual(selectedItem.category)
    : null;

  const handleToggleCategory = (category: ExpenseCategory) => {
    onSelectCategory(selectedCategory === category ? null : category);
  };

  const countLabel =
    expenseCount === 0
      ? 'Sem gastos'
      : expenseCount === 1
        ? '1 lançamento'
        : `${expenseCount} lançamentos`;

  return (
    <View style={[styles.card, isCompact && styles.cardCompact]}>
      <View style={styles.topRow}>
        <Text style={styles.eyebrow}>Resumo do mês</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{countLabel}</Text>
        </View>
      </View>

      <View
        style={[
          styles.ringWrapper,
          { width: donutSize, height: donutSize },
        ]}
      >
        <Svg width={donutSize} height={donutSize}>
          {segments.length === 0 ? (
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={theme.colors.surfaceMuted}
              strokeWidth={donutStrokeWidth}
              fill="none"
            />
          ) : segments.length === 1 ? (
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={getCategoryVisual(segments[0].item.category).fill}
              strokeWidth={donutStrokeWidth}
              fill="none"
              onPress={() => handleToggleCategory(segments[0].item.category)}
            />
          ) : (
            segments.map((segment) => {
              const visual = getCategoryVisual(segment.item.category);
              const isSelected = selectedCategory === segment.item.category;
              const isDimmed = selectedCategory !== null && !isSelected;

              return (
                <Path
                  key={segment.item.category}
                  d={segment.pathData}
                  stroke={visual.fill}
                  strokeWidth={donutStrokeWidth}
                  strokeLinecap="round"
                  strokeOpacity={isDimmed ? 0.35 : 1}
                  fill="none"
                  onPress={() => handleToggleCategory(segment.item.category)}
                />
              );
            })
          )}
        </Svg>

        {segments.map((segment) => {
          const visual = getCategoryVisual(segment.item.category);
          const meta = getCategoryMetadata(segment.item.category);
          const isSelected = selectedCategory === segment.item.category;
          const isDimmed = selectedCategory !== null && !isSelected;

          return (
            <Pressable
              key={`icon-${segment.item.category}`}
              onPress={() => handleToggleCategory(segment.item.category)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Ver detalhes da categoria ${meta.label}`}
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.iconOverlay,
                {
                  left: segment.iconX - ICON_HIT_SIZE / 2,
                  top: segment.iconY - ICON_HIT_SIZE / 2,
                  opacity: isDimmed ? 0.45 : 1,
                },
                isSelected && styles.iconOverlaySelected,
              ]}
            >
              <Feather
                name={visual.icon}
                size={isCompact ? 13 : 15}
                color={theme.colors.textPrimary}
              />
            </Pressable>
          );
        })}

        <View
          style={[styles.centerContent, { width: innerContentWidth }]}
          pointerEvents="none"
        >
          <Text
            style={[styles.totalValue, isCompact && styles.totalValueCompact]}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {formatCentsToBRL(totalCents)}
          </Text>
          <Text style={styles.centerSubtitle}>Total gasto no mês</Text>
        </View>
      </View>

      {selectedItem && selectedMeta && selectedVisual ? (
        <View style={styles.detailBar} accessibilityRole="summary">
          <View style={styles.detailLeft}>
            <View
              style={[
                styles.detailIconDot,
                { backgroundColor: selectedVisual.fill },
              ]}
            >
              <Feather
                name={selectedVisual.icon}
                size={13}
                color={theme.colors.textPrimary}
              />
            </View>
            <Text style={styles.detailText} numberOfLines={1}>
              {selectedMeta.label} • {formatCentsToBRL(selectedItem.totalCents)}{' '}
              ({selectedItem.percentage}%)
            </Text>
          </View>

          <Pressable
            onPress={() => onSelectCategory(null)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Fechar detalhe da categoria"
            style={styles.detailCloseButton}
          >
            <Feather name="x" size={14} color={theme.colors.textOnInk} />
          </Pressable>
        </View>
      ) : activeItems.length > 0 ? (
        <Text style={styles.hintText}>
          Toque em uma categoria do anel para ver o detalhe
        </Text>
      ) : (
        <Text style={styles.hintText}>
          Seus gastos do mês aparecerão distribuídos no gráfico
        </Text>
      )}
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
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  cardCompact: {
    paddingHorizontal: theme.spacing.md,
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  eyebrow: {
    ...theme.typography.micro,
    color: theme.colors.textSecondary,
  },
  countBadge: {
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  countText: {
    ...theme.typography.numericCaption,
    fontSize: 11.5,
    color: theme.colors.textPrimary,
  },
  ringWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    position: 'relative',
  },
  iconOverlay: {
    position: 'absolute',
    width: ICON_HIT_SIZE,
    height: ICON_HIT_SIZE,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOverlaySelected: {
    borderWidth: 1.5,
    borderColor: theme.colors.borderStrong,
    backgroundColor: 'rgba(246, 243, 235, 0.35)',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  totalValue: {
    ...theme.typography.numericDisplay,
    fontSize: 25,
    lineHeight: 31,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  totalValueCompact: {
    fontSize: 21,
    lineHeight: 27,
  },
  centerSubtitle: {
    ...theme.typography.micro,
    fontSize: 9.5,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  detailBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.ink,
    borderRadius: theme.radius.md,
    paddingLeft: 10,
    paddingRight: 10,
    paddingVertical: 9,
    marginTop: theme.spacing.md,
    gap: 8,
  },
  detailLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIconDot: {
    width: 26,
    height: 26,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    ...theme.typography.numericCaption,
    fontFamily: theme.fonts.sansBold,
    color: theme.colors.textOnInk,
    flexShrink: 1,
  },
  detailCloseButton: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.inkElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    ...theme.typography.captionRegular,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
});
