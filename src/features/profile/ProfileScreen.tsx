import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useAuth } from '../../auth/useAuth';
import { StudentTabs } from '../../navigation/StudentTabs';
import { TeacherProfileScreen } from './TeacherProfileScreen';

/**
 * Post-login entry point (`AppStack`'s `Home`). Renders role-specific content — the student gets
 * the real tab structure (`StudentTabs`, ROADMAP.md "Фаза 3": Профиль/Расписание); Teacher/Admin
 * still get a single screen each until Фаза 6/7 build out their own modules.
 */
export function ProfileScreen() {
  const { role, claims, logout } = useAuth();

  if (role === 'STUDENT') return <StudentTabs />;
  if (role === 'TEACHER') return <TeacherProfileScreen />;

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
