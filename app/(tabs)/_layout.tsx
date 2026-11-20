import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/presentation/components/FloatingTabBar';
import { theme } from '@/presentation/theme/theme';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.canvas },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="analytics" options={{ title: 'Análise' }} />
    </Tabs>
  );
}
