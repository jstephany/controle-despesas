import { Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function BootstrapScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Controle de Despesas' }} />
      <Text style={styles.title}>Controle de Despesas</Text>
      <Text style={styles.subtitle}>Ambiente Expo Router + SQLite configurado.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
  },
});
