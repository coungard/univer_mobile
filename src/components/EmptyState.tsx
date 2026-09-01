import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

interface Props {
  title: string;
  description?: string;
}

/**
 * Generic "nothing here yet" state (Фаза 0's "базовые компоненты", finally needed for real by
 * Фаза 2's "студент без группы"). Reusable later for empty lists — schedule, courses, attendance
 * history, etc.
 */
export function EmptyState({ title, description }: Props) {
  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      {description ? (
        <Text variant="bodyMedium" style={styles.description}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 8,
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    opacity: 0.7,
  },
});
