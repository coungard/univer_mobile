import React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Checkbox, ProgressBar, Text, useTheme } from 'react-native-paper';
import { ApiError } from '../../api/errors';
import { EmptyState } from '../../components/EmptyState';
import { TeacherStackScreenProps } from '../../navigation/types';
import { formatDayDate, formatTime } from '../schedule/dateUtils';
import { useLectureQuery } from '../schedule/hooks';
import { useLectureAttendanceStatsQuery, useLectureRosterQuery, useMarkAttendanceMutation } from './hooks';

type Props = TeacherStackScreenProps<'LectureDetails'>;

/**
 * Детали занятия для преподавателя — то же самое `LectureDto`, что и студенческий
 * `LectureDetailsScreen`, плюс отметка посещаемости и статистика по лекции (ROADMAP.md "Фаза 6").
 * Ростер — активные (`ACTIVE`) зачисления курса лекции, не студенты по группе: прямого эндпоинта
 * «студенты группы» для роли `TEACHER` нет (см. `api/endpoints/enrollments.ts`), а зачисление — и
 * есть то условие, которое реально проверяет `POST /attendance` (иначе `422`).
 */
export function TeacherLectureDetailsScreen({ route }: Props) {
  const { lectureId } = route.params;
  const lecture = useLectureQuery(lectureId);
  const stats = useLectureAttendanceStatsQuery(lectureId);
  const roster = useLectureRosterQuery(lectureId, lecture.data?.courseId);
  const mark = useMarkAttendanceMutation(lectureId);
  const theme = useTheme();

  if (lecture.isLoading) {
    return (
      <View style={styles.center}>
        <Text>Загрузка занятия…</Text>
      </View>
    );
  }

  if (lecture.isError || !lecture.data) {
    return (
      <View style={styles.center}>
        <EmptyState title="Не удалось загрузить занятие" description="Проверьте подключение к сети." />
      </View>
    );
  }

  const start = new Date(lecture.data.scheduledTime);
  const end = lecture.data.durationMinutes != null ? new Date(start.getTime() + lecture.data.durationMinutes * 60000) : null;

  const handleToggle = (studentId: string, current: boolean | undefined) => {
    mark.mutate(
      { studentId, attended: !current },
      {
        onError: (error) =>
          Alert.alert('Не удалось отметить', error instanceof ApiError ? error.message : 'Попробуйте ещё раз.'),
      },
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall">{lecture.data.title}</Text>
      <Text style={styles.muted}>
        {formatDayDate(start)}, {formatTime(start)}
        {end ? ` – ${formatTime(end)}` : ''}
        {lecture.data.room ? ` · ауд. ${lecture.data.room}` : ''}
      </Text>

      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.label}>
          Посещаемость
        </Text>
        {stats.isLoading ? (
          <Text variant="bodyMedium">Загрузка…</Text>
        ) : stats.isError || !stats.data ? (
          <Text variant="bodyMedium" style={styles.muted}>
            Не удалось загрузить статистику.
          </Text>
        ) : (
          <>
            <Text variant="bodyLarge">
              Отмечено {stats.data.attendedCount ?? 0} из {stats.data.totalMarked ?? 0} (
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
          Ростер (активные зачисления курса)
        </Text>
        <Text style={styles.caption}>
          Показан ID студента — карточка с ФИО недоступна роли «Преподаватель» (ограничение бэкенда,
          см. API.md: `GET /students/{"{id}"}` требует роль STUDENT у вызывающего).
        </Text>

        {roster.isLoading ? (
          <Text variant="bodyMedium">Загрузка…</Text>
        ) : roster.isError ? (
          <Text variant="bodyMedium" style={styles.muted}>
            Не удалось загрузить список студентов.
          </Text>
        ) : roster.roster.length === 0 ? (
          <EmptyState
            title="Никто не зачислен"
            description="На этот курс пока нет активных зачислений — отмечать некого."
          />
        ) : (
          roster.roster.map((entry) => (
            <Checkbox.Item
              key={entry.studentId}
              label={`Студент ${entry.studentId.slice(0, 8)}`}
              status={entry.attended === undefined ? 'indeterminate' : entry.attended ? 'checked' : 'unchecked'}
              onPress={() => handleToggle(entry.studentId, entry.attended)}
            />
          ))
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
  muted: {
    opacity: 0.6,
  },
  section: {
    marginTop: 20,
  },
  label: {
    opacity: 0.6,
    marginBottom: 2,
  },
  caption: {
    opacity: 0.5,
    fontSize: 12,
    marginBottom: 8,
  },
  progressBar: {
    marginTop: 8,
    height: 8,
    borderRadius: 4,
  },
});
