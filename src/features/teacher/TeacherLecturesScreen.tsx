import React, { useMemo } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PairDto } from '../../api/types';
import { EmptyState } from '../../components/EmptyState';
import { TeacherTabScreenProps } from '../../navigation/types';
import { useCoursesQuery, useOwnCoursesQuery } from '../courses/hooks';
import { DAY_OPTIONS, PARITY_OPTIONS } from '../schedule/PairFormScreen';
import { formatDayDate, formatTime } from '../schedule/dateUtils';
import {
  useOwnPairsQuery,
  useTeacherGenerateSemesterLecturesMutation,
  useTeacherLecturesQuery,
} from './hooks';

type Props = TeacherTabScreenProps<'Lectures'>;

const DAY_LABELS = Object.fromEntries(DAY_OPTIONS.map((o) => [o.value, o.label])) as Record<string, string>;
const PARITY_LABELS = Object.fromEntries(PARITY_OPTIONS.map((o) => [o.value, o.label])) as Record<string, string>;

/**
 * Таб «Мои лекции» (ROADMAP.md "Фаза 6"): уже сгенерированные/созданные занятия своих курсов, плюс
 * «Шаблоны» — собственные `Pair` (заполняются `STUDENT`/`ADMIN`, у `TEACHER` нет доступа на
 * запись — см. API.md), из которых можно сгенерировать занятия: на конкретную дату
 * (`GenerateLecture`, по одному шаблону) или на весь семестр разом (по всем шаблонам одного цикла —
 * идемпотентно, кнопку безопасно нажимать повторно).
 */
export function TeacherLecturesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const courses = useOwnCoursesQuery();
  const pairs = useOwnPairsQuery();
  // Union with `useOwnPairsQuery()`'s course ids, not just `useOwnCoursesQuery()`'s — confirmed live
  // that a course can carry pairs/lectures for this teacher without `CourseDto.teacherId` itself being
  // set (see `useTeacherLecturesQuery`'s doc comment), so relying on courses alone would silently
  // undercount "Мои занятия".
  const courseIds = useMemo(() => {
    const ids = new Set((courses.data ?? []).map((c) => c.id));
    for (const pair of pairs.data ?? []) ids.add(pair.courseId);
    return Array.from(ids);
  }, [courses.data, pairs.data]);
  const lectures = useTeacherLecturesQuery(courseIds);
  const allCourses = useCoursesQuery(null);
  const generateSemester = useTeacherGenerateSemesterLecturesMutation();

  // Resolves titles from the full catalogue, not just `useOwnCoursesQuery()` — same reason as
  // `courseIds` above: a lecture/pair's course may not list this teacher via `CourseDto.teacherId`.
  const courseTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of allCourses.data ?? []) map.set(c.id, c.title);
    return map;
  }, [allCourses.data]);

  // One "Сгенерировать на семестр" per distinct cycle, not per `Pair` — the endpoint generates every
  // still-missing `Lecture` for the whole cycle in one call (see `api/endpoints/lectures.ts`).
  const pairsByCycle = useMemo(() => {
    const map = new Map<string, PairDto[]>();
    for (const pair of pairs.data ?? []) {
      const list = map.get(pair.weekScheduleCycleId) ?? [];
      list.push(pair);
      map.set(pair.weekScheduleCycleId, list);
    }
    return map;
  }, [pairs.data]);

  const handleGenerateSemester = (cycleId: string, cyclePairs: PairDto[]) => {
    Alert.alert(
      'Сгенерировать занятия?',
      `Будут созданы занятия по ${cyclePairs.length} ${cyclePairs.length === 1 ? 'шаблону' : 'шаблонам'} на весь семестр. Уже созданные занятия не дублируются — повторный запуск безопасен.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Сгенерировать',
          onPress: () => {
            generateSemester.mutate(cycleId, {
              onSuccess: (created) => Alert.alert('Готово', `Создано занятий: ${created.length}.`),
              onError: (error) => Alert.alert('Не удалось сгенерировать', error instanceof Error ? error.message : ''),
            });
          },
        },
      ],
    );
  };

  const isLoading = courses.isLoading || lectures.isLoading || pairs.isLoading;

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingTop: insets.top }]}
      refreshControl={
        <RefreshControl
          refreshing={lectures.isLoading || pairs.isLoading}
          onRefresh={() => {
            lectures.refetch();
            pairs.refetch();
          }}
        />
      }
    >
      <View style={styles.header}>
        <Text variant="titleMedium">Мои занятия</Text>
        <Button compact mode="contained-tonal" onPress={() => navigation.navigate('LectureForm')}>
          + Добавить
        </Button>
      </View>

      {isLoading ? (
        <Text style={styles.muted}>Загрузка…</Text>
      ) : lectures.data.length === 0 ? (
        <EmptyState title="Занятий пока нет" description="Создайте вручную или сгенерируйте из шаблона ниже." />
      ) : (
        lectures.data.map((lecture) => {
          const scheduledAt = new Date(lecture.scheduledTime);
          return (
            <Pressable
              key={lecture.id}
              style={styles.lectureRow}
              onPress={() => navigation.navigate('LectureDetails', { lectureId: lecture.id })}
            >
              <View style={styles.lectureInfo}>
                <Text variant="bodyMedium">{lecture.title}</Text>
                <Text style={styles.muted}>
                  {courseTitleById.get(lecture.courseId) ?? 'Курс'} · {formatDayDate(scheduledAt)},{' '}
                  {formatTime(scheduledAt)}
                </Text>
              </View>
            </Pressable>
          );
        })
      )}

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Шаблоны занятий
      </Text>

      {isLoading ? null : pairsByCycle.size === 0 ? (
        <EmptyState
          title="Шаблонов пока нет"
          description="Шаблоны занятий (Pair) заполняют студенты своей группы или администратор — как только появятся, здесь можно будет сгенерировать по ним занятия."
        />
      ) : (
        Array.from(pairsByCycle.entries()).map(([cycleId, cyclePairs]) => (
          <View key={cycleId} style={styles.cycleSection}>
            {cyclePairs.map((pair) => (
              <View key={pair.id} style={styles.pairRow}>
                <View style={styles.lectureInfo}>
                  <Text variant="bodyMedium">{courseTitleById.get(pair.courseId) ?? 'Курс'}</Text>
                  <Text style={styles.muted}>
                    {DAY_LABELS[pair.dayOfWeek]}, пара {pair.pairNumber} · {PARITY_LABELS[pair.weekParity]}
                    {pair.room ? ` · ауд. ${pair.room}` : ''}
                  </Text>
                </View>
                <Button compact onPress={() => navigation.navigate('GenerateLecture', { pairId: pair.id })}>
                  На дату
                </Button>
              </View>
            ))}
            <Button
              mode="contained"
              style={styles.generateButton}
              loading={generateSemester.isPending}
              disabled={generateSemester.isPending}
              onPress={() => handleGenerateSemester(cycleId, cyclePairs)}
            >
              Сгенерировать на семестр
            </Button>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 4,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 8,
  },
  muted: {
    opacity: 0.6,
  },
  lectureRow: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#0002',
  },
  lectureInfo: {
    flex: 1,
    gap: 2,
  },
  cycleSection: {
    marginBottom: 20,
    gap: 4,
  },
  pairRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#0002',
  },
  generateButton: {
    marginTop: 8,
  },
});
