import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ExpensesProvider } from '@/presentation/context/ExpensesContext';
import { theme } from '@/presentation/theme/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ExpensesProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.canvas },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="new-expense" />
        </Stack>
      </ExpensesProvider>
    </SafeAreaProvider>
  );
}
