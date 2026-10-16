import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LectureDto } from '../../api/types';
import { EmptyState } from '../../components/EmptyState';
import { QueryErrorState } from '../../components/QueryErrorState';
import { StudentTabScreenProps } from '../../navigation/types';
import { Hint } from '../hints/Hint';
import { useNewcomer } from '../hints/useNewcomer';
import { firstUnfilledSetupStep, openSetupAt } from '../onboarding/studentSetup';
import { useOwnStudentQuery } from '../profile/hooks';
import { libraryFonts, libraryHintColors } from '../../theme/library';
import { DaySpines } from './DaySpines';
import { GroupCaption } from './GroupCaption';
import {
  addDays,
  dayName,
  formatDayDate,
  formatTime,
  formatWeekRangeLabel,
  getWeek,
  isSameDay,
  nearestOutside,
  shortDayName,
  startOfDay,
  weekOffsetOf,
} from './dateUtils';
import { useGroupPairsQuery, useMyLecturesQuery, useOwnWeekScheduleCycleQuery } from './hooks';
import { useScheduleViewMode, useSettingsStore } from '../settings/settingsStore';
import { firstEnabledFrom, shownWeekDays } from './scheduleDays';
import { roomAndTeacher } from './teacherName';

const TODAY = new Date();

type Props = StudentTabScreenProps<'Schedule'>;

/**
 * Таб «Расписание» (ROADMAP.md "Фаза 3"). Недельная сетка день × лекции на основе
 * `GET /lectures/me`, которую корешки дней слева (`DaySpines`, issue #59) схлопывают до одного
 * дня и разворачивают обратно: переключение недель вперёд/назад, выделение текущего дня, pull-to-refresh,
 * и пустое состояние — как для случая «нет группы» (Фаза 2), так и для «группа есть, но лекций
 * ещё не сгенерировали». Тап по занятию открывает `LectureDetailsScreen` (Фаза 4).
 */
export function ScheduleScreen({ navigation, route }: Props) {
  const student = useOwnStudentQuery();
  const lectures = useMyLecturesQuery();
  // The spines always show `week`; in the day mode `day` is one of its days (`shift` keeps it so).
  const [weekOffset, setWeekOffset] = useState(0);
  const [day, setDay] = useState(() => startOfDay(TODAY));
  const view = useScheduleViewMode();
  const enabledDays = useSettingsStore((state) => state.scheduleDays);
  const newcomer = useNewcomer();

  // Only actually used once the schedule turns out empty (see the empty-state branch below), but
  // called unconditionally: each hook already no-ops via `enabled` when its id is undefined, so
  // there's nothing wrong with paying for it even on the (far more common) non-empty path, and it
  // keeps hook order stable.
  const cycle = useOwnWeekScheduleCycleQuery(student.data?.groupId ?? undefined);
  const pairs = useGroupPairsQuery(student.data?.groupId ?? undefined);

  // This tab's `Tab.Navigator` renders with `headerShown: false`, so nothing else accounts for the
  // status bar — without this, the week-navigation buttons render partly underneath it, where taps
  // land on the system status bar instead of the app (confirmed on-device, not just a visual
  // overlap).
  const insets = useSafeAreaInsets();

  const week = useMemo(() => getWeek(weekOffset, TODAY), [weekOffset]);

  const lectureData = lectures.data;

  // Coming back from saving a pair: jump to the week of the lecture it produced (PLAN.md, M28).
  const showLectureId = route.params?.showLectureId;
  const shownLecture = showLectureId ? lectureData?.find((lecture) => lecture.id === showLectureId) : undefined;
  const shownLectureTime = shownLecture?.scheduledTime;
  useEffect(() => {
    if (!shownLectureTime) return;
    const scheduledAt = new Date(shownLectureTime);
    setWeekOffset(weekOffsetOf(scheduledAt, TODAY));
    setDay(startOfDay(scheduledAt));
  }, [shownLectureTime]);

  // The days picked in «Настройки» (issue #67), plus a day turned off that has a lecture anyway.
  const lectureTimes = useMemo(() => (lectureData ?? []).map((lecture) => lecture.scheduledTime), [lectureData]);
  const weekDays = useMemo(
    () => shownWeekDays(week.days, enabledDays, lectureTimes),
    [week.days, enabledDays, lectureTimes],
  );
  // The day view doesn't open a day turned off: on such a day it moves on to the next enabled one
  // (today on a Sunday turned off opens Monday, the next week).
  useEffect(() => {
    if (view.mode !== 'day' || shownWeekDays([day], enabledDays, lectureTimes).length > 0) return;
    const next = firstEnabledFrom(day, enabledDays);
    setDay(next);
    setWeekOffset(weekOffsetOf(next, TODAY));
  }, [view.mode, day, enabledDays, lectureTimes]);

  const shownDays = useMemo(() => (view.mode === 'day' ? [day] : weekDays), [view.mode, day, weekDays]);
  const lecturesByDay = useMemo(() => {
    const map = new Map<number, LectureDto[]>();
    for (const shown of shownDays) map.set(shown.getTime(), []);
    for (const lecture of lectureData ?? []) {
      const scheduledAt = new Date(lecture.scheduledTime);
      const shown = shownDays.find((d) => isSameDay(d, scheduledAt));
      if (shown) map.get(shown.getTime())!.push(lecture);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
    }
    return map;
  }, [lectureData, shownDays]);

  // Nothing in the shown week or day, but lectures elsewhere (holidays, before or after the
  // semester): a way straight to the nearest one (issue #64). A student without any lecture — a
  // newcomer among them, who has the way to the first pair instead — gets none.
  const nearest = useMemo(
    () =>
      view.mode === 'day'
        ? nearestOutside(lectureData ?? [], day, addDays(day, 1))
        : nearestOutside(lectureData ?? [], week.start, week.end),
    [lectureData, view.mode, day, week],
  );
  const nearestAt = nearest ? new Date(nearest.item.scheduledTime) : undefined;
  const goToNearest = () => {
    if (!nearest || !nearestAt) return;
    setWeekOffset(weekOffsetOf(nearestAt, TODAY));
    setDay(startOfDay(nearestAt));
    // Marked like a just-saved pair; no newcomer hint with it.
    navigation.setParams({ showLectureId: nearest.item.id, firstPair: undefined });
  };

  const openDay = (next: Date) => {
    setDay(next);
    view.setMode('day');
  };

  // By a week in both modes; a shown day moves to the same weekday of the next week.
  const shift = (direction: 1 | -1) => {
    setWeekOffset((offset) => offset + direction);
    setDay((current) => addDays(current, 7 * direction));
  };

  const atToday =
    view.mode === 'day'
      ? isSameDay(day, TODAY) || isSameDay(day, firstEnabledFrom(TODAY, enabledDays))
      : weekOffset === 0;
  const goToToday = () => {
    setDay(startOfDay(TODAY));
    setWeekOffset(0);
  };

  // `view.ready`: the remembered mode is read from the device first, so a day doesn't flash as a week.
  if (lectures.isLoading || student.isLoading || !view.ready) {
    return (
      <View style={styles.center}>
        <Text>Загрузка расписания…</Text>
      </View>
    );
  }

  if (lectures.isError) {
    return (
      <View style={styles.center}>
        <QueryErrorState error={lectures.error} onRetry={() => lectures.refetch()} />
      </View>
    );
  }

  if ((lectures.data ?? []).length === 0) {
    const hasGroup = student.data?.groupId != null;

    // Без группы вообще нет смысла смотреть на цикл/пары — этот кейс не меняется «студенческой
    // генерацией расписания» из UI_UX.md. Группу студент выбирает сам в мастере настройки (PLAN_FINISHED_01.MD).
    if (!hasGroup) {
      const setupStep = student.data ? firstUnfilledSetupStep(student.data) : null;
      return (
        <View style={styles.center}>
          <EmptyState
            title="Расписание пока пусто"
            description="Вы ещё не выбрали группу. Расписание появится сразу после этого."
          />
          {setupStep ? (
            <Hint
              id="setup-start"
              active={newcomer.kind === 'newcomer'}
              stage={newcomer.kind === 'newcomer' ? newcomer.stage : 0}
              text="До расписания три шага: факультет, группа и первая пара. Начнём?"
            >
              <Button mode="contained" onPress={() => openSetupAt(setupStep, (step) => navigation.navigate(step))}>
                Завершить настройку
              </Button>
            </Hint>
          ) : null}
        </View>
      );
    }

    if (cycle.isLoading || pairs.isLoading) {
      return (
        <View style={styles.center}>
          <Text>Загрузка расписания…</Text>
        </View>
      );
    }

    // The server opens the semester's schedule itself (univer#96), so a group without one is no
    // longer a state — only a failed request leaves `cycle.data` empty.
    if (!cycle.data) {
      return (
        <View style={styles.center}>
          <QueryErrorState error={cycle.error} onRetry={() => cycle.refetch()} />
        </View>
      );
    }

    const hasOwnPairs = (pairs.data ?? []).length > 0;

    // «Цикл в AGREED, Pair моей группы нет» — окно самостоятельного заполнения уже закрыто, CTA не
    // показываем (UI_UX.md раздел 6).
    if (!hasOwnPairs && cycle.data.status === 'AGREED') {
      return (
        <View style={styles.center}>
          <GroupCaption groupId={student.data?.groupId} centered />
          <EmptyState
            title="Расписание пока пусто"
            description="Расписание группы не заполнено и уже согласовано — обратитесь к администратору."
          />
        </View>
      );
    }

    // Оставшиеся два случая раздела 6 — «Pair моей группы нет» (цикл в DRAFT) и «Pair заполнены,
    // Lecture нет» — оба ведут на один и тот же экран «Расписание группы»: там же и форма
    // заполнения, и кнопка «Сгенерировать занятия на семестр» (UI_UX.md раздел 4).
    return (
      <View style={styles.center}>
        <GroupCaption groupId={student.data?.groupId} centered />
        <EmptyState
          title="Расписание пока пусто"
          description={
            hasOwnPairs
              ? 'Пары вашей группы сохранены, но занятия по ним ещё не созданы.'
              : 'Заполните расписание своей группы — занятия появятся здесь сразу.'
          }
        />
        <Hint
          id="schedule-fill"
          stage={2}
          text="У вашей группы ещё нет расписания. Добавьте первую пару — это минута."
          active={newcomer.kind === 'newcomer' && newcomer.missing === 'pair'}
        >
          <Button mode="contained" onPress={() => navigation.navigate('GroupSchedule')}>
            {hasOwnPairs ? 'Показать пары в расписании' : 'Заполнить расписание группы'}
          </Button>
        </Hint>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <DaySpines
        days={weekDays}
        selected={view.mode === 'day' ? day : null}
        today={TODAY}
        onPickWeek={() => view.setMode('week')}
        onPickDay={openDay}
      />

      <View style={styles.main}>
        <View style={styles.weekHeader}>
          <Button compact accessibilityLabel="Предыдущая неделя" labelStyle={styles.arrow} onPress={() => shift(-1)}>
            ‹
          </Button>
          <Text style={styles.weekLabel}>{formatWeekRangeLabel(week)}</Text>
          <Button compact accessibilityLabel="Следующая неделя" labelStyle={styles.arrow} onPress={() => shift(1)}>
            ›
          </Button>
        </View>

        <GroupCaption groupId={student.data?.groupId} style={styles.caption} />

        {/* Постоянная, а не только «пока пусто», точка входа — расписание группы можно донабрать и
            позже (например, добавить пару на вторую половину семестра), не только при первом заходе
            с чистого листа (UI_UX.md раздел 4). */}
        <View style={styles.links}>
          <Button compact onPress={() => navigation.navigate('GroupSchedule')}>
            Расписание группы →
          </Button>
          {atToday ? null : (
            <Button compact onPress={goToToday}>
              Сегодня
            </Button>
          )}
        </View>

        {nearest && nearestAt ? (
          <View style={styles.nearest}>
            <Button compact onPress={goToNearest}>
              {nearest.later
                ? `Ближайшее занятие — ${shortDayName(nearestAt)}, ${formatDayDate(nearestAt)} →`
                : `← Последнее занятие — ${shortDayName(nearestAt)}, ${formatDayDate(nearestAt)}`}
            </Button>
          </View>
        ) : null}

        <ScrollView
          contentContainerStyle={styles.days}
          refreshControl={<RefreshControl refreshing={lectures.isRefetching} onRefresh={() => lectures.refetch()} />}
        >
          {shownDays.map((shown) => {
            const dayLectures = lecturesByDay.get(shown.getTime()) ?? [];
            const today = isSameDay(shown, TODAY);
            const title = (
              <Text variant="titleSmall" style={view.mode === 'day' ? styles.dayTitleLarge : styles.dayTitle}>
                {dayName(shown)}, {formatDayDate(shown)}
                {today ? ' · сегодня' : ''}
              </Text>
            );
            return (
              <View key={shown.getTime()} style={[styles.daySection, today && styles.dayToday]}>
                {/* In a week the title opens that day on its own. */}
                {view.mode === 'week' ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityHint="Показать только этот день"
                    onPress={() => openDay(shown)}
                  >
                    {title}
                  </Pressable>
                ) : (
                  title
                )}
                {dayLectures.length === 0 ? (
                  <Text style={styles.emptyDay}>Нет занятий</Text>
                ) : (
                  dayLectures.map((lecture) => {
                    const meta = roomAndTeacher(lecture.room, lecture.teacherName);
                    const row = (
                      <Pressable
                        style={[styles.lectureRow, lecture.id === showLectureId && styles.lectureShown]}
                        onPress={() => navigation.navigate('LectureDetails', { lectureId: lecture.id })}
                      >
                        <Text style={styles.lectureTime}>{formatTime(new Date(lecture.scheduledTime))}</Text>
                        <View style={styles.lectureInfo}>
                          <Text variant="bodyMedium">{lecture.title}</Text>
                          {meta ? <Text style={styles.lectureRoom}>{meta}</Text> : null}
                        </View>
                      </Pressable>
                    );
                    // The newcomer's path ends here: the group has a pair now, so no other hint follows.
                    return lecture.id === showLectureId && route.params?.firstPair ? (
                      <Hint
                        key={lecture.id}
                        id="first-pair-done"
                        stage={2}
                        text="Готово — это ваша первая пара, она стоит в расписании на весь семестр. Остальные добавляются так же: «Расписание группы» вверху."
                      >
                        {row}
                      </Hint>
                    ) : (
                      <React.Fragment key={lecture.id}>{row}</React.Fragment>
                    );
                  })
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  main: {
    flex: 1,
    minWidth: 0,
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
    paddingHorizontal: 2,
    paddingTop: 8,
  },
  arrow: {
    fontSize: 22,
    lineHeight: 26,
  },
  weekLabel: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 17,
  },
  caption: {
    paddingLeft: 14,
    paddingRight: 16,
  },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 4,
  },
  nearest: {
    alignItems: 'flex-start',
  },
  days: {
    paddingLeft: 14,
    paddingRight: 16,
    paddingVertical: 16,
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
  dayTitleLarge: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 20,
    lineHeight: 28,
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
  lectureShown: {
    borderRadius: 8,
    paddingHorizontal: 8,
    marginHorizontal: -8,
    backgroundColor: libraryHintColors.shown,
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
