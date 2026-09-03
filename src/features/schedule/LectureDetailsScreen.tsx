import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { EmptyState } from '../../components/EmptyState';
import { StudentStackScreenProps } from '../../navigation/types';
import { useTeacherQuery } from '../profile/hooks';
import { formatDayDate, formatTime } from './dateUtils';
import { useLectureQuery } from './hooks';

type Props = StudentStackScreenProps<'LectureDetails'>;

/**
 * Детали занятия (ROADMAP.md "Фаза 4"): `title`/`content`/`room` из `LectureDto`, имя
 * преподавателя (`teacherId` опционален), время начала/окончания и длительность, и переход в
 * карточку курса за один тап.
 */
export function LectureDetailsScreen({ route, navigation }: Props) {
  const { lectureId } = route.params;
  const lecture = useLectureQuery(lectureId);
  const teacher = useTeacherQuery(lecture.data?.teacherId);

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
        <Button mode="outlined" onPress={() => lecture.refetch()}>
          Повторить
        </Button>
      </View>
    );
  }

  const start = new Date(lecture.data.scheduledTime);
  const end = lecture.data.durationMinutes != null ? new Date(start.getTime() + lecture.data.durationMinutes * 60000) : null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall">{lecture.data.title}</Text>

      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.label}>
          Когда
        </Text>
        <Text variant="bodyLarge">
          {formatDayDate(start)}, {formatTime(start)}
          {end ? ` – ${formatTime(end)}` : ''}
        </Text>
        {lecture.data.durationMinutes != null ? (
          <Text variant="bodyMedium" style={styles.muted}>
            {lecture.data.durationMinutes} мин
          </Text>
        ) : null}
      </View>

      {lecture.data.room ? (
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.label}>
            Аудитория
          </Text>
          <Text variant="bodyLarge">{lecture.data.room}</Text>
        </View>
      ) : null}

      {lecture.data.teacherId ? (
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.label}>
            Преподаватель
          </Text>
          <Text variant="bodyLarge">{teacher.data?.fullname ?? (teacher.isLoading ? '…' : '—')}</Text>
        </View>
      ) : null}

      {lecture.data.content ? (
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.label}>
            Содержание
          </Text>
          <Text variant="bodyMedium">{lecture.data.content}</Text>
        </View>
      ) : null}

      <Button
        mode="outlined"
        style={styles.courseButton}
        onPress={() => navigation.navigate('CourseDetails', { courseId: lecture.data!.courseId })}
      >
        Открыть курс
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
  section: {
    marginTop: 16,
  },
  label: {
    opacity: 0.6,
    marginBottom: 2,
  },
  muted: {
    opacity: 0.6,
  },
  courseButton: {
    marginTop: 24,
  },
});
