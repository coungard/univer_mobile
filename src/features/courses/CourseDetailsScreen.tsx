import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { describeError } from '../../api/errors';
import { EmptyState } from '../../components/EmptyState';
import { QueryErrorState } from '../../components/QueryErrorState';
import { StudentStackScreenProps } from '../../navigation/types';
import { libraryFonts, useLibraryColors } from '../../theme/library';
import { AttendanceTime, useSelfMark } from '../attendance/AttendanceTime';
import { useMyCourseAttendanceSummaryQuery } from '../attendance/hooks';
import { canMark } from '../attendance/selfMark';
import { useDepartmentQuery, useTeacherQuery } from '../profile/hooks';
import { formatDayDate, formatTime, shortDayName } from '../schedule/dateUtils';
import { useMyLecturesQuery } from '../schedule/hooks';
import { useCourseQuery } from './hooks';

type Props = StudentStackScreenProps<'CourseDetails'>;

/**
 * Карточка курса (ROADMAP.md "Фаза 4"): `title`/`description` из `CourseDto` плюс имя кафедры и
 * преподавателя, резолвнутые по `departmentId`/`teacherId` (оба поля опциональны — `CourseDto`
 * сериализуется с `@JsonInclude(NON_NULL)`, см. API.md, так что могут отсутствовать вовсе).
 * Посещаемость (issue #71) — плитки «был / не был / без отметки» из сводки и история начавшихся
 * занятий курса с той же плашкой времени, что в расписании. Открывается и из таба «Курсы», и из
 * деталей лекции.
 */
export function CourseDetailsScreen({ route, navigation }: Props) {
  const { courseId } = route.params;
  const course = useCourseQuery(courseId);
  const department = useDepartmentQuery(course.data?.departmentId);
  const teacher = useTeacherQuery(course.data?.teacherId);
  const summary = useMyCourseAttendanceSummaryQuery(courseId);
  const lectures = useMyLecturesQuery();
  const selfMark = useSelfMark();
  const colors = useLibraryColors();

  // Started lectures of this course, newest first — each can be marked here as in the schedule.
  const history = useMemo(() => {
    const now = new Date();
    return (lectures.data ?? [])
      .filter((lecture) => lecture.courseId === courseId && canMark(lecture, now))
      .sort((a, b) => b.scheduledTime.localeCompare(a.scheduledTime));
  }, [lectures.data, courseId]);

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
        <QueryErrorState error={course.error} onRetry={() => course.refetch()} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
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

        {/* Посещаемость (issue #71) — секция сугубо дополнительная к самому курсу, поэтому её
            загрузка/ошибка не блокирует остальную карточку, в отличие от `course` выше. */}
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.label}>
            Посещаемость
          </Text>
          {summary.isLoading ? (
            <Text variant="bodyMedium">Загрузка…</Text>
          ) : summary.isError || !summary.data ? (
            <Text variant="bodyMedium" style={styles.description}>
              {describeError(summary.error).message}
            </Text>
          ) : (
            <View style={styles.tiles}>
              <View style={[styles.tile, { backgroundColor: colors.attendedTint }]}>
                <Text style={[styles.tileCount, { color: colors.sage }]}>{summary.data.attended ?? 0}</Text>
                <Text style={{ color: colors.sage }}>был</Text>
              </View>
              <View style={[styles.tile, { backgroundColor: colors.missedTint }]}>
                <Text style={[styles.tileCount, { color: colors.rust }]}>{summary.data.missed ?? 0}</Text>
                <Text style={{ color: colors.rust }}>не был</Text>
              </View>
              <View style={[styles.tile, styles.tileUnmarked, { borderColor: colors.inkFaint }]}>
                <Text style={styles.tileCount}>{summary.data.unmarked ?? 0}</Text>
                <Text style={{ color: colors.inkMuted }}>без отметки</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.label}>
            История
          </Text>
          {lectures.isLoading ? (
            <Text variant="bodyMedium">Загрузка…</Text>
          ) : lectures.isError ? (
            <Text variant="bodyMedium" style={styles.description}>
              {describeError(lectures.error).message}
            </Text>
          ) : history.length === 0 ? (
            <EmptyState title="Занятий пока не было" description="Здесь появятся занятия по мере их проведения." />
          ) : (
            history.map((lecture) => {
              const scheduledAt = new Date(lecture.scheduledTime);
              return (
                <Pressable
                  key={lecture.id}
                  style={[styles.historyRow, { borderBottomColor: colors.border }]}
                  onPress={() => navigation.navigate('LectureDetails', { lectureId: lecture.id })}
                >
                  <Text variant="bodyLarge" style={styles.historyDate}>
                    {shortDayName(scheduledAt)}, {formatDayDate(scheduledAt)}
                  </Text>
                  <AttendanceTime
                    time={formatTime(scheduledAt)}
                    mark={selfMark.markOf(lecture.id)}
                    markable
                    size="history"
                    onPress={() => selfMark.toggle(lecture.id)}
                  />
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
      {selfMark.snackbar}
    </View>
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
  screen: {
    flex: 1,
  },
  tiles: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  tile: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    gap: 2,
  },
  tileUnmarked: {
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  tileCount: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 26,
    lineHeight: 32,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyDate: {
    flex: 1,
  },
});
