import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useAuth } from '../../auth/useAuth';
import { useFacultyQuery, useOwnTeacherQuery } from './hooks';

/**
 * Профиль преподавателя. Не входит непосредственно в скоуп ROADMAP.md "Фаза 2"/"Фаза 3" (обе про
 * студентов), но занимает то же место в навигации, что и таб «Профиль» студента — поэтому
 * реализован сразу же, чтобы у преподавателя после логина был реальный экран, а не заглушка.
 * «Мои курсы»/«Мои лекции» — полноценный модуль преподавателя из ROADMAP.md "Фаза 6".
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
        <Text>Не удалось загрузить профиль.</Text>
        <Button mode="outlined" onPress={() => teacher.refetch()}>
          Повторить
        </Button>
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
