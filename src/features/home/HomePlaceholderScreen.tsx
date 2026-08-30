import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useAuth } from '../../auth/useAuth';

/**
 * Stand-in for the real home screen (Profile + Weekly Schedule — ROADMAP.md "Фаза 3"). Its job
 * for now is just to prove the authenticated stack renders and to host the Logout button
 * (Фаза 1, issue "Логаут").
 */
export function HomePlaceholderScreen() {
  const { claims, role, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Вы вошли</Text>
      <Text variant="bodyMedium" style={styles.info}>
        {claims?.preferred_username ?? claims?.email ?? claims?.sub}
        {role ? ` · ${role}` : ''}
      </Text>
      <Text variant="bodySmall" style={styles.note}>
        Экраны профиля и расписания появятся в Фазе 3 (см. ROADMAP.md).
      </Text>
      <Button mode="outlined" onPress={() => logout()} style={styles.button}>
        Выйти
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  info: {
    opacity: 0.8,
  },
  note: {
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
});
