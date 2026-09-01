import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useAuth } from '../../auth/useAuth';
import { StudentProfileScreen } from './StudentProfileScreen';
import { TeacherProfileScreen } from './TeacherProfileScreen';

/**
 * Post-login entry point (`AppStack`'s `Home`). Renders role-specific content — the real per-role
 * tab structure (Profile/Schedule/Courses/...) is ROADMAP.md "Фаза 3"+; for now each role gets a
 * single screen here.
 */
export function ProfileScreen() {
  const { role, claims, logout } = useAuth();

  if (role === 'STUDENT') return <StudentProfileScreen onLogout={logout} />;
  if (role === 'TEACHER') return <TeacherProfileScreen onLogout={logout} />;

  // ADMIN (or an unexpected/missing role) — no Student/Teacher entity on the backend to show;
  // the admin module itself is ROADMAP.md "Фаза 7".
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Вы вошли</Text>
      <Text variant="bodyMedium" style={styles.info}>
        {claims?.preferred_username ?? claims?.email ?? claims?.sub}
        {role ? ` · ${role}` : ''}
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
  button: {
    marginTop: 16,
  },
});
