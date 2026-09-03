import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { EmptyState } from '../../components/EmptyState';
import { StudentStackScreenProps } from '../../navigation/types';
import { useDepartmentQuery, useTeacherQuery } from '../profile/hooks';
import { useCourseQuery } from './hooks';

type Props = StudentStackScreenProps<'CourseDetails'>;

/**
 * Карточка курса (ROADMAP.md "Фаза 4"): `title`/`description` из `CourseDto` плюс имя кафедры и
 * преподавателя, резолвнутые по `departmentId`/`teacherId` (оба поля опциональны — `CourseDto`
 * сериализуется с `@JsonInclude(NON_NULL)`, см. API.md, так что могут отсутствовать вовсе).
 * Открывается и из таба «Курсы», и из деталей лекции.
 */
export function CourseDetailsScreen({ route }: Props) {
  const { courseId } = route.params;
  const course = useCourseQuery(courseId);
  const department = useDepartmentQuery(course.data?.departmentId);
  const teacher = useTeacherQuery(course.data?.teacherId);

  if (course.isLoading) {
    return (
      <View style={styles.center}>
        <Text>Загрузка курса…</Text>
      </View>
    );
  }

  if (course.isError || !course.data) {
    return (
      <View style={styles.center}>
        <EmptyState title="Не удалось загрузить курс" description="Проверьте подключение к сети." />
        <Button mode="outlined" onPress={() => course.refetch()}>
          Повторить
        </Button>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall">{course.data.title}</Text>

      {course.data.description ? (
        <Text variant="bodyMedium" style={styles.description}>
          {course.data.description}
        </Text>
      ) : null}

      {department.data ? (
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.label}>
            Кафедра
          </Text>
          <Text variant="bodyLarge">{department.data.name}</Text>
        </View>
      ) : null}

      {course.data.teacherId ? (
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.label}>
            Преподаватель
          </Text>
          <Text variant="bodyLarge">{teacher.data?.fullname ?? (teacher.isLoading ? '…' : '—')}</Text>
        </View>
      ) : null}
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
  description: {
    marginTop: 8,
    marginBottom: 16,
    opacity: 0.8,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    opacity: 0.6,
    marginBottom: 2,
  },
});
