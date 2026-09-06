import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useAuth } from '../../auth/useAuth';
import { QueryErrorState } from '../../components/QueryErrorState';
import { useFacultyQuery, useOwnTeacherQuery } from './hooks';

/**
 * Профиль преподавателя — таб «Профиль» в `TeacherTabs` (ROADMAP.md "Фаза 6"), рядом с «Курсы» и
 * «Лекции» (`TeacherCoursesScreen`/`TeacherLecturesScreen`).
 */
export function TeacherProfileScreen() {
  const { logout } = useAuth();
  const teacher = useOwnTeacherQuery();
  const faculty = useFacultyQuery(teacher.data?.facultyId);

  if (teacher.isLoading) {
    return (
      <View style={styles.center}>
        <Text>Загрузка профиля…</Text>
      </View>
    );
  }

  if (teacher.isError || !teacher.data) {
    return (
      <View style={styles.center}>
        <QueryErrorState error={teacher.error} onRetry={() => teacher.refetch()} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall">{teacher.data.fullname || teacher.data.username}</Text>
      <Text variant="bodyMedium" style={styles.email}>
        {teacher.data.email}
      </Text>
      <Text variant="bodyMedium">{teacher.data.position}</Text>
      <Text variant="bodyMedium" style={styles.faculty}>
        {faculty.data?.name ?? ''}
      </Text>

      <Button mode="outlined" onPress={() => logout()} style={styles.logout}>
        Выйти
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  email: {
    opacity: 0.7,
    marginBottom: 8,
  },
  faculty: {
    opacity: 0.7,
    marginBottom: 16,
  },
  logout: {
    marginTop: 24,
  },
});
