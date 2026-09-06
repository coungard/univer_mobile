import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, ProgressBar, Text, useTheme } from 'react-native-paper';
import { EmptyState } from '../../components/EmptyState';
import { StudentStackScreenProps } from '../../navigation/types';
import { useOwnCourseAttendanceHistoryQuery, useOwnCourseAttendanceStatsQuery } from '../attendance/hooks';
import { useDepartmentQuery, useTeacherQuery } from '../profile/hooks';
import { formatDayDate, formatTime } from '../schedule/dateUtils';
import { useCourseQuery } from './hooks';

type Props = StudentStackScreenProps<'CourseDetails'>;

/**
 * Карточка курса (ROADMAP.md "Фаза 4"): `title`/`description` из `CourseDto` плюс имя кафедры и
 * преподавателя, резолвнутые по `departmentId`/`teacherId` (оба поля опциональны — `CourseDto`
 * сериализуется с `@JsonInclude(NON_NULL)`, см. API.md, так что могут отсутствовать вовсе).
 * Открывается и из таба «Курсы», и из деталей лекции.
 */
export function CourseDetailsScreen({ route, navigation }: Props) {
  const { courseId } = route.params;
  const course = useCourseQuery(courseId);
  const department = useDepartmentQuery(course.data?.departmentId);
  const teacher = useTeacherQuery(course.data?.teacherId);
  const stats = useOwnCourseAttendanceStatsQuery(courseId);
  const history = useOwnCourseAttendanceHistoryQuery(courseId);
  const theme = useTheme();

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

      {/* Посещаемость (ROADMAP.md "Фаза 5") — секция сугубо дополнительная к самому курсу, поэтому
          её загрузка/ошибка не блокирует остальную карточку, в отличие от `course` выше. */}
      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.label}>
          Посещаемость
        </Text>
        {stats.isLoading ? (
          <Text variant="bodyMedium">Загрузка…</Text>
        ) : stats.isError || !stats.data ? (
          <Text variant="bodyMedium" style={styles.description}>
            Не удалось загрузить статистику посещаемости.
          </Text>
        ) : (stats.data.totalMarked ?? 0) === 0 ? (
          <Text variant="bodyMedium" style={styles.description}>
            По этому курсу пока нет ни одной отметки.
          </Text>
        ) : (
          <>
            <Text variant="bodyLarge">
              {stats.data.attendedCount ?? 0} из {stats.data.totalMarked} занятий (
              {Math.round((stats.data.attendanceRate ?? 0) * 100)}%)
            </Text>
            <ProgressBar
              progress={stats.data.attendanceRate ?? 0}
              style={styles.progressBar}
              color={theme.colors.primary}
            />
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.label}>
          История посещений
        </Text>
        {history.isLoading ? (
          <Text variant="bodyMedium">Загрузка…</Text>
        ) : history.isError ? (
          <Text variant="bodyMedium" style={styles.description}>
            Не удалось загрузить историю посещений.
          </Text>
        ) : history.entries.length === 0 ? (
          <EmptyState title="Отметок пока нет" description="Здесь появятся занятия по мере их проведения." />
        ) : (
          history.entries.map(({ lecture, attended }) => {
            const scheduledAt = new Date(lecture.scheduledTime);
            return (
              <Pressable
                key={lecture.id}
                style={styles.historyRow}
                onPress={() => navigation.navigate('LectureDetails', { lectureId: lecture.id })}
              >
                <View style={styles.historyInfo}>
                  <Text variant="bodyMedium">{lecture.title}</Text>
                  <Text style={styles.historyDate}>
                    {formatDayDate(scheduledAt)}, {formatTime(scheduledAt)}
                  </Text>
                </View>
                <Text style={{ color: attended ? theme.colors.primary : theme.colors.error }}>
                  {attended ? 'Посетил' : 'Пропустил'}
                </Text>
              </Pressable>
            );
          })
        )}
      </View>
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
  progressBar: {
    marginTop: 8,
    height: 8,
    borderRadius: 4,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    opacity: 0.6,
  },
});
