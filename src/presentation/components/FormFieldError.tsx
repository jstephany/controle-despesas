import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme/theme';

interface FormFieldErrorProps {
  readonly message?: string;
}

export function FormFieldError({ message }: FormFieldErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <View style={styles.container} accessibilityRole="alert">
      <Feather name="alert-circle" size={14} color={theme.colors.danger} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  text: {
    ...theme.typography.caption,
    color: theme.colors.danger,
    flexShrink: 1,
  },
});
