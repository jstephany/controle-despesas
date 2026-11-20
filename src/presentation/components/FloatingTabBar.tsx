import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useExpenses } from '../hooks/useExpenses';
import { theme } from '../theme/theme';

interface TabRoute {
  readonly key: string;
  readonly name: string;
}

interface FloatingTabBarProps {
  readonly state: {
    readonly index: number;
    readonly routes: readonly TabRoute[];
  };
  readonly insets: {
    readonly bottom: number;
  };
  readonly navigateToTab: (routeKey: string) => void;
  readonly emitter?: {
    emit: (options: {
      type: 'tabPress';
      target: string;
      canPreventDefault: true;
    }) => { defaultPrevented: boolean };
  };
}

export function FloatingTabBar({
  state,
  insets,
  navigateToTab,
  emitter,
}: FloatingTabBarProps) {
  const { selectedPeriod } = useExpenses();

  const homeRoute = state.routes.find((route) => route.name === 'index');
  const analyticsRoute = state.routes.find((route) => route.name === 'analytics');

  const activeRouteName = state.routes[state.index]?.name ?? 'index';
  const isHomeActive = activeRouteName === 'index';
  const isAnalyticsActive = activeRouteName === 'analytics';

  const handleOpenNewExpense = () => {
    if (isHomeActive) {
      router.push({
        pathname: '/new-expense',
        params: {
          year: String(selectedPeriod.year),
          month: String(selectedPeriod.month),
        },
      });
      return;
    }
    router.push('/new-expense');
  };

  const handleNavigateTab = (route: TabRoute | undefined, isFocused: boolean) => {
    if (!route) return;
    const event = emitter?.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (!isFocused && !event?.defaultPrevented) {
      navigateToTab(route.key);
    }
  };

  const bottomOffset = Math.max(insets.bottom, 12) + 8;

  return (
    <View
      style={[styles.wrapper, { bottom: bottomOffset }]}
      pointerEvents="box-none"
    >
      <View style={styles.pill}>
        <Pressable
          onPress={() => handleNavigateTab(homeRoute, isHomeActive)}
          accessibilityRole="tab"
          accessibilityState={{ selected: isHomeActive }}
          accessibilityLabel="Aba Início"
          style={({ pressed }) => [
            styles.tabButton,
            pressed && styles.tabPressed,
          ]}
        >
          <Feather
            name="home"
            size={20}
            color={
              isHomeActive
                ? theme.colors.textOnInk
                : theme.colors.textMutedOnInk
            }
          />
          <Text
            style={[
              styles.tabLabel,
              isHomeActive && styles.tabLabelActive,
            ]}
          >
            Início
          </Text>
          {isHomeActive ? <View style={styles.activeDot} /> : null}
        </Pressable>

        <View style={styles.centerSlot}>
          <Pressable
            onPress={handleOpenNewExpense}
            accessibilityRole="button"
            accessibilityLabel="Adicionar nova despesa"
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
          >
            <Feather name="plus" size={24} color={theme.colors.ink} />
          </Pressable>
        </View>

        <Pressable
          onPress={() => handleNavigateTab(analyticsRoute, isAnalyticsActive)}
          accessibilityRole="tab"
          accessibilityState={{ selected: isAnalyticsActive }}
          accessibilityLabel="Aba Análise"
          style={({ pressed }) => [
            styles.tabButton,
            pressed && styles.tabPressed,
          ]}
        >
          <Feather
            name="bar-chart-2"
            size={20}
            color={
              isAnalyticsActive
                ? theme.colors.textOnInk
                : theme.colors.textMutedOnInk
            }
          />
          <Text
            style={[
              styles.tabLabel,
              isAnalyticsActive && styles.tabLabelActive,
            ]}
          >
            Análise
          </Text>
          {isAnalyticsActive ? <View style={styles.activeDot} /> : null}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  pill: {
    width: '100%',
    maxWidth: 380,
    height: 66,
    backgroundColor: theme.colors.ink,
    borderRadius: 33,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    shadowColor: '#161615',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 10,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabPressed: {
    opacity: 0.75,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMutedOnInk,
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color: theme.colors.textOnInk,
    fontWeight: '700',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentSage,
    marginTop: 1,
  },
  centerSlot: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentSage,
    borderWidth: 4,
    borderColor: theme.colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    shadowColor: '#161615',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 8,
  },
  addButtonPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.9,
  },
});
