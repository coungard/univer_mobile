import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { LectureDto } from '../../api/types';
import { EmptyState } from '../../components/EmptyState';
import { StudentTabScreenProps } from '../../navigation/types';
import { useOwnStudentQuery } from '../profile/hooks';
import { dayName, formatDayDate, formatTime, formatWeekRangeLabel, getWeek, isSameDay } from './dateUtils';
import { useMyLecturesQuery } from './hooks';

const TODAY = new Date();

type Props = StudentTabScreenProps<'Schedule'>;

/**
 * Таб «Расписание» (ROADMAP.md "Фаза 3"). Недельная сетка день × лекции на основе
 * `GET /lectures/me`: переключение недель вперёд/назад, выделение текущего дня, pull-to-refresh,
 * и пустое состояние — как для случая «нет группы» (Фаза 2), так и для «группа есть, но лекций
 * ещё не сгенерировали». Тап по занятию открывает `LectureDetailsScreen` (Фаза 4).
 */
export function ScheduleScreen({ navigation }: Props) {
  const student = useOwnStudentQuery();
  const lectures = useMyLecturesQuery();
  const [weekOffset, setWeekOffset] = useState(0);

  const week = useMemo(() => getWeek(weekOffset, TODAY), [weekOffset]);

  const lectureData = lectures.data;
  const lecturesByDay = useMemo(() => {
    const map = new Map<number, LectureDto[]>();
    for (const day of week.days) map.set(day.getTime(), []);
    for (const lecture of lectureData ?? []) {
      const scheduledAt = new Date(lecture.scheduledTime);
      const day = week.days.find((d) => isSameDay(d, scheduledAt));
      if (day) map.get(day.getTime())!.push(lecture);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
    }
    return map;
  }, [lectureData, week.days]);

  if (lectures.isLoading || student.isLoading) {
    return (
      <View style={styles.center}>
        <Text>Загрузка расписания…</Text>
      </View>
    );
  }

  if (lectures.isError) {
    return (
      <View style={styles.center}>
        <EmptyState title="Не удалось загрузить расписание" description="Проверьте подключение к сети." />
        <Button mode="outlined" onPress={() => lectures.refetch()}>
          Повторить
        </Button>
      </View>
    );
  }

  if ((lectures.data ?? []).length === 0) {
    const hasGroup = student.data?.groupId != null;
    return (
      <View style={styles.center}>
        <EmptyState
          title="Расписание пока пусто"
          description={
            hasGroup
              ? 'Для вашей группы ещё не сгенерированы занятия. Загляните позже.'
              : 'Группа ещё не назначена — обратитесь к администратору. Расписание появится, как только вас включат в группу.'
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.weekHeader}>
        <Button compact onPress={() => setWeekOffset((o) => o - 1)}>
          ← Пред.
        </Button>
        <Text variant="titleMedium">{formatWeekRangeLabel(week)}</Text>
        <Button compact onPress={() => setWeekOffset((o) => o + 1)}>
          След. →
        </Button>
      </View>

      <ScrollView
        contentContainerStyle={styles.days}
        refreshControl={<RefreshControl refreshing={lectures.isRefetching} onRefresh={() => lectures.refetch()} />}
      >
        {week.days.map((day) => {
          const dayLectures = lecturesByDay.get(day.getTime()) ?? [];
          const today = isSameDay(day, TODAY);
          return (
            <View key={day.getTime()} style={[styles.daySection, today && styles.dayToday]}>
              <Text variant="titleSmall" style={styles.dayTitle}>
                {dayName(day)}, {formatDayDate(day)}
                {today ? ' · сегодня' : ''}
              </Text>
              {dayLectures.length === 0 ? (
                <Text style={styles.emptyDay}>Нет занятий</Text>
              ) : (
                dayLectures.map((lecture) => (
                  <Pressable
                    key={lecture.id}
                    style={styles.lectureRow}
                    onPress={() => navigation.navigate('LectureDetails', { lectureId: lecture.id })}
                  >
                    <Text style={styles.lectureTime}>{formatTime(new Date(lecture.scheduledTime))}</Text>
                    <View style={styles.lectureInfo}>
                      <Text variant="bodyMedium">{lecture.title}</Text>
                      {lecture.room ? <Text style={styles.lectureRoom}>ауд. {lecture.room}</Text> : null}
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  days: {
    padding: 16,
    gap: 20,
  },
  daySection: {
    gap: 6,
  },
  dayToday: {
    opacity: 1,
  },
  dayTitle: {
    opacity: 0.8,
  },
  emptyDay: {
    opacity: 0.5,
    fontStyle: 'italic',
  },
  lectureRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  lectureTime: {
    width: 48,
    opacity: 0.7,
  },
  lectureInfo: {
    flex: 1,
  },
  lectureRoom: {
    opacity: 0.6,
  },
});
