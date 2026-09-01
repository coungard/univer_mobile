import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useAuth } from '../../auth/useAuth';
import { EmptyState } from '../../components/EmptyState';
import { useGroupAcademicPathQuery, useOwnStudentQuery, useUniversityQuery } from './hooks';

/**
 * Таб «Профиль» для студента (ROADMAP.md "Фаза 2"/"Фаза 3"). Обязательный кейс Фазы 2: студент без
 * назначенной группы (`groupId == null`) видит понятное пустое состояние вместо ошибок, и как
 * только admin назначит группу — при следующем открытии этого экрана (без доп. действий
 * пользователя) вместо пустого состояния появятся факультет/программа/группа.
 */
export function StudentProfileScreen() {
  const { logout } = useAuth();
  const student = useOwnStudentQuery();
  const university = useUniversityQuery(student.data?.universityId);
  const academicPath = useGroupAcademicPathQuery(student.data?.groupId);

  if (student.isLoading) {
    return (
      <View style={styles.center}>
        <Text>Загрузка профиля…</Text>
      </View>
    );
  }

  if (student.isError || !student.data) {
    return (
      <View style={styles.center}>
        <EmptyState
          title="Не удалось загрузить профиль"
          description="Проверьте подключение к сети и попробуйте ещё раз."
        />
        <Button mode="outlined" onPress={() => student.refetch()}>
          Повторить
        </Button>
      </View>
    );
  }

  const hasGroup = student.data.groupId != null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall">{student.data.fullname || student.data.username}</Text>
      <Text variant="bodyMedium" style={styles.email}>
        {student.data.email}
      </Text>

      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.label}>
          Университет
        </Text>
        <Text variant="bodyLarge">{university.data?.name ?? '—'}</Text>
      </View>

      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.label}>
          Дата зачисления
        </Text>
        <Text variant="bodyLarge">{student.data.enrollmentDate}</Text>
      </View>

      {hasGroup ? (
        <>
          <View style={styles.section}>
            <Text variant="labelLarge" style={styles.label}>
              Факультет
            </Text>
            <Text variant="bodyLarge">{academicPath.faculty?.name ?? (academicPath.isLoading ? '…' : '—')}</Text>
          </View>
          <View style={styles.section}>
            <Text variant="labelLarge" style={styles.label}>
              Программа
            </Text>
            <Text variant="bodyLarge">{academicPath.program?.name ?? (academicPath.isLoading ? '…' : '—')}</Text>
          </View>
          <View style={styles.section}>
            <Text variant="labelLarge" style={styles.label}>
              Группа
            </Text>
            <Text variant="bodyLarge">{academicPath.group?.name ?? (academicPath.isLoading ? '…' : '—')}</Text>
          </View>
        </>
      ) : (
        <View style={styles.section}>
          <EmptyState
            title="Группа ещё не назначена"
            description="Обратитесь к администратору. Как только группу назначат, здесь появится расписание."
          />
        </View>
      )}

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
    paddingHorizontal: 24,
  },
  email: {
    opacity: 0.7,
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    opacity: 0.6,
    marginBottom: 2,
  },
  logout: {
    marginTop: 24,
  },
});
