import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { useAuth } from '../../auth/useAuth';
import { QueryErrorState } from '../../components/QueryErrorState';
import { StudentTabScreenProps } from '../../navigation/types';
import { firstUnfilledSetupStep, SETUP_STEP_PROMPTS, useSetupPromptStore } from '../onboarding/studentSetup';
import {
  useFacultyQuery,
  useGroupAcademicPathQuery,
  useOwnStudentQuery,
  useOwnUserId,
  useUniversityQuery,
} from './hooks';

/**
 * Таб «Профиль» для студента (ROADMAP.md "Фаза 2"/"Фаза 3"). Студент сам заполняет цепочку
 * университет → факультет → курс → группа в мастере настройки (PLAN.md), и остановиться может на
 * любом звене — поэтому профиль показывает то, что уже выбрано, а для первого незаполненного
 * звена выводит карточку «Завершить настройку». Один раз за запуск приложения мастер для
 * незаполненного профиля открывается сам — так сразу после регистрации студент попадает на шаг 2.
 */
export function StudentProfileScreen() {
  const { logout } = useAuth();
  const navigation = useNavigation<StudentTabScreenProps<'Profile'>['navigation']>();
  const userId = useOwnUserId();
  const student = useOwnStudentQuery();
  const university = useUniversityQuery(student.data?.universityId ?? undefined);
  const ownFaculty = useFacultyQuery(student.data?.facultyId ?? undefined);
  const academicPath = useGroupAcademicPathQuery(student.data?.groupId);

  const setupStep = student.data ? firstUnfilledSetupStep(student.data) : null;
  const promptedFor = useSetupPromptStore((state) => state.promptedFor);
  const markPrompted = useSetupPromptStore((state) => state.markPrompted);

  useEffect(() => {
    if (!setupStep || !userId || promptedFor === userId) return;
    markPrompted(userId);
    navigation.navigate(setupStep);
  }, [setupStep, userId, promptedFor, markPrompted, navigation]);

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
        <QueryErrorState error={student.error} onRetry={() => student.refetch()} />
      </View>
    );
  }

  const hasGroup = student.data.groupId != null;
  // A group assigned by an administrator may come without `facultyId` — fall back to the group's own chain.
  const facultyName = ownFaculty.data?.name ?? academicPath.faculty?.name;
  const facultyLoading = ownFaculty.isLoading || academicPath.isLoading;

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
        <Text variant="bodyLarge">
          {student.data.universityId ? (university.data?.name ?? (university.isLoading ? '…' : '—')) : 'Не выбран'}
        </Text>
      </View>

      {student.data.enrollmentDate ? (
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.label}>
            Дата зачисления
          </Text>
          <Text variant="bodyLarge">{student.data.enrollmentDate}</Text>
        </View>
      ) : null}

      {student.data.facultyId || hasGroup ? (
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.label}>
            Факультет
          </Text>
          <Text variant="bodyLarge">{facultyName ?? (facultyLoading ? '…' : '—')}</Text>
        </View>
      ) : null}

      {student.data.yearNumber != null ? (
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.label}>
            Курс
          </Text>
          <Text variant="bodyLarge">{student.data.yearNumber}</Text>
        </View>
      ) : null}

      {hasGroup ? (
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.label}>
            Группа
          </Text>
          <Text variant="bodyLarge">{academicPath.group?.name ?? (academicPath.isLoading ? '…' : '—')}</Text>
        </View>
      ) : null}

      {setupStep ? (
        <Card mode="outlined" style={styles.section}>
          <Card.Title title="Завершить настройку" subtitle={SETUP_STEP_PROMPTS[setupStep]} />
          <Card.Content>
            <Text variant="bodyMedium">Расписание появится, как только вы выберете свою группу.</Text>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={() => navigation.navigate(setupStep)}>
              Продолжить
            </Button>
          </Card.Actions>
        </Card>
      ) : null}

      {student.data.universityId ? (
        // The wizard resumes at the first unfilled step, so this is the only way back to the steps
        // above it — e.g. out of a university that turned out to have no faculties in the catalog.
        <Button mode="text" onPress={() => navigation.navigate('SetupRegion')}>
          Изменить университет или группу
        </Button>
      ) : null}

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
