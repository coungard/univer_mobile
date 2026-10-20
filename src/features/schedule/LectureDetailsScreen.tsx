import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { QueryErrorState } from '../../components/QueryErrorState';
import { StudentStackScreenProps } from '../../navigation/types';
import { AttendanceTime, useSelfMark } from '../attendance/AttendanceTime';
import { canMark, markWord } from '../attendance/selfMark';
import { useTeacherQuery } from '../profile/hooks';
import { formatDayDate, formatTime } from './dateUtils';
import { useLectureQuery } from './hooks';
import { teacherDisplayName } from './teacherName';

type Props = StudentStackScreenProps<'LectureDetails'>;

/**
 * Детали занятия (ROADMAP.md "Фаза 4"): `title`/`content`/`room` из `LectureDto`, имя
 * преподавателя полностью (`teacherName` — вписанное в паре или имя зарегистрированного, issue #68;
 * зарегистрированный без полного имени дозапрашивается), время начала/окончания и длительность,
 * отметка посещаемости у начавшегося занятия (issue #71) и переход в карточку курса за один тап.
 */
export function LectureDetailsScreen({ route, navigation }: Props) {
  const { lectureId } = route.params;
  const lecture = useLectureQuery(lectureId);
  const selfMark = useSelfMark();
  const teacher = useTeacherQuery(lecture.data?.teacherName ? undefined : lecture.data?.teacherId);
  const teacherName =
    lecture.data?.teacherName ?? (teacher.data ? teacherDisplayName(teacher.data) : teacher.isLoading ? '…' : '—');

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
        <QueryErrorState error={lecture.error} onRetry={() => lecture.refetch()} />
      </View>
    );
  }

  const start = new Date(lecture.data.scheduledTime);
  const end = lecture.data.durationMinutes != null ? new Date(start.getTime() + lecture.data.durationMinutes * 60000) : null;
  const mark = selfMark.markOf(lectureId);

  return (
    <View style={styles.screen}>
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

        {canMark(lecture.data, new Date()) ? (
          <View style={styles.section}>
            <Text variant="labelLarge" style={styles.label}>
              Посещаемость
            </Text>
            <View style={styles.markRow}>
              <AttendanceTime
                time={formatTime(start)}
                mark={mark}
                markable
                size="day"
                onPress={() => selfMark.toggle(lectureId)}
              />
              <Text variant="bodyLarge" style={styles.markText}>
                {mark.byTeacher
                  ? `${markWord(mark.mark)} — отметил преподаватель`
                  : mark.mark === 'none'
                    ? 'Без отметки — нажмите на время'
                    : markWord(mark.mark)}
              </Text>
            </View>
          </View>
        ) : null}

        {lecture.data.room ? (
          <View style={styles.section}>
            <Text variant="labelLarge" style={styles.label}>
              Аудитория
            </Text>
            <Text variant="bodyLarge">{lecture.data.room}</Text>
          </View>
        ) : null}

        {lecture.data.teacherId || lecture.data.teacherName ? (
          <View style={styles.section}>
            <Text variant="labelLarge" style={styles.label}>
              Преподаватель
            </Text>
            <Text variant="bodyLarge">{teacherName}</Text>
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
      {selfMark.snackbar}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  markRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  markText: {
    flex: 1,
  },
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
