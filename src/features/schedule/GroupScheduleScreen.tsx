import React, { useMemo } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { Button, Chip, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PairDto } from '../../api/types';
import { EmptyState } from '../../components/EmptyState';
import { QueryErrorState } from '../../components/QueryErrorState';
import { StudentStackScreenProps } from '../../navigation/types';
import { useAllCoursesQuery } from '../courses/hooks';
import { Hint } from '../hints/Hint';
import { useNewcomer } from '../hints/useNewcomer';
import { useOwnStudentQuery, useSemesterQuery } from '../profile/hooks';
import { DAY_OPTIONS, PARITY_OPTIONS } from './PairFormScreen';
import {
  useDeletePairMutation,
  useEffectiveBellScheduleQuery,
  useGenerateSemesterLecturesMutation,
  useGroupPairsQuery,
  useOwnWeekScheduleCycleQuery,
} from './hooks';

type Props = StudentStackScreenProps<'GroupSchedule'>;

const DAY_LABELS = Object.fromEntries(DAY_OPTIONS.map((o) => [o.value, o.label])) as Record<string, string>;
const PARITY_LABELS = Object.fromEntries(PARITY_OPTIONS.map((o) => [o.value, o.label])) as Record<string, string>;
const DAY_ORDER = DAY_OPTIONS.map((o) => o.value);

/**
 * «Расписание группы» — студент заполняет `Pair` своей группы (`UI_UX.md` раздел 4). Занятия по
 * паре создаются при её сохранении, а при изменении и удалении пары сервер сам приводит их в
 * соответствие; кнопка генерации здесь — запасная, на случай сбоя после сохранения. Список по дням, как и `ScheduleScreen`, не жёсткая сетка день×номер пары —
 * та же причина, что и там: `weekParity` может дать две разные пары на один день+номер (ODD/EVEN
 * недели), сетка усложнила бы отображение без реальной пользы для MVP.
 */
export function GroupScheduleScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const student = useOwnStudentQuery();
  const cycle = useOwnWeekScheduleCycleQuery(student.data?.groupId ?? undefined);
  const semester = useSemesterQuery(cycle.data?.semesterId);
  const pairs = useGroupPairsQuery(student.data?.groupId ?? undefined);
  const courses = useAllCoursesQuery();
  const bellSchedule = useEffectiveBellScheduleQuery(student.data?.universityId ?? undefined);

  const deletePair = useDeletePairMutation(student.data?.groupId ?? undefined);
  const generate = useGenerateSemesterLecturesMutation();
  const newcomer = useNewcomer();

  const courseTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of courses.data ?? []) map.set(c.id, c.title);
    return map;
  }, [courses.data]);

  // The pair's own time is what its lectures are made with; the bell schedule covers pairs saved
  // before the server started filling it in.
  const timeFor = (pair: PairDto) => {
    const entry = pair.startTime && pair.endTime ? pair : bellSchedule.data?.find((e) => e.pairNumber === pair.pairNumber);
    return entry?.startTime && entry.endTime ? `${entry.startTime.slice(0, 5)}–${entry.endTime.slice(0, 5)}` : null;
  };

  const isLoading = student.isLoading || cycle.isLoading || pairs.isLoading;
  const queryError = student.isError ? student.error : cycle.isError ? cycle.error : pairs.isError ? pairs.error : null;

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text>Загрузка расписания группы…</Text>
      </View>
    );
  }

  if (queryError) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <QueryErrorState
          error={queryError}
          onRetry={() => {
            student.refetch();
            cycle.refetch();
            pairs.refetch();
          }}
        />
      </View>
    );
  }

  // Only a student without a group gets here: with one, the server opens the semester's schedule.
  if (!cycle.data) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <EmptyState
          title="Группа не выбрана"
          description="Расписание группы появится, когда вы выберете группу в профиле."
        />
      </View>
    );
  }

  const activeCycle = cycle.data;
  const isDraft = activeCycle.status !== 'AGREED';
  const pairList = pairs.data ?? [];

  const sections = DAY_ORDER.map((day) => ({
    day,
    items: pairList.filter((p) => p.dayOfWeek === day).sort((a, b) => a.pairNumber - b.pairNumber),
  }));

  const handleDelete = (pair: PairDto) => {
    Alert.alert(
      'Удалить занятие?',
      `${DAY_LABELS[pair.dayOfWeek]}, пара ${pair.pairNumber}. Занятия по ней будут убраны из расписания.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            deletePair.mutate(pair.id, {
              onError: (error) => Alert.alert('Не удалось удалить', error instanceof Error ? error.message : ''),
            });
          },
        },
      ],
    );
  };

  const handleGenerate = () => {
    const range = semester.data ? `${semester.data.startDate} – ${semester.data.endDate}` : 'семестра';
    Alert.alert(
      'Сгенерировать занятия?',
      `Будут созданы занятия по ${pairList.length} ${pairList.length === 1 ? 'паре' : 'парам'} вашей группы на период ${range}. Уже созданные занятия не дублируются — повторный запуск безопасен.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Сгенерировать',
          onPress: () => {
            generate.mutate(activeCycle.id, {
              onSuccess: (created) =>
                Alert.alert('Готово', `Создано занятий: ${created.length}. Загляните в таб «Расписание».`),
              onError: (error) =>
                Alert.alert('Не удалось сгенерировать', error instanceof Error ? error.message : ''),
            });
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Chip>{isDraft ? 'Черновик' : 'Согласовано'}</Chip>
        {isDraft ? (
          <Hint
            id="group-schedule-add"
            stage={2}
            text="Начните с любой пары, которую помните: день, номер пары и предмет."
            active={newcomer.kind === 'newcomer' && newcomer.missing === 'pair'}
          >
            <Button mode="contained-tonal" compact onPress={() => navigation.navigate('PairForm')}>
              + Добавить
            </Button>
          </Hint>
        ) : null}
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={sections}
        keyExtractor={(s) => s.day}
        ListEmptyComponent={
          <EmptyState
            title="Расписание группы пока пусто"
            description={
              isDraft
                ? 'Добавьте хотя бы одно занятие кнопкой «+ Добавить» выше.'
                : 'Расписание не заполнено и уже согласовано — обратитесь к администратору.'
            }
          />
        }
        renderItem={({ item: section }) => (
          <View style={styles.daySection}>
            <Text variant="titleSmall" style={styles.dayTitle}>
              {DAY_LABELS[section.day]}
            </Text>
            {section.items.length === 0 ? (
              <Text style={styles.emptyDay}>Нет занятий</Text>
            ) : (
              section.items.map((pair) => (
                <View key={pair.id} style={[styles.pairRow, { borderBottomColor: theme.colors.outlineVariant }]}>
                  <View style={styles.pairInfo}>
                    <Text variant="bodyMedium">
                      Пара {pair.pairNumber} · {PARITY_LABELS[pair.weekParity]}
                    </Text>
                    <Text variant="bodyMedium">{courseTitleById.get(pair.courseId) ?? 'Предмет'}</Text>
                    <Text style={styles.muted}>
                      {[timeFor(pair), pair.room ? `ауд. ${pair.room}` : null].filter(Boolean).join(' · ') || '—'}
                    </Text>
                  </View>
                  {isDraft ? (
                    <View style={styles.pairActions}>
                      <Button compact onPress={() => navigation.navigate('PairForm', { pairId: pair.id })}>
                        Изменить
                      </Button>
                      <Button compact textColor={theme.colors.error} onPress={() => handleDelete(pair)}>
                        Удалить
                      </Button>
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </View>
        )}
      />

      {pairList.length > 0 ? (
        <Button
          mode="contained"
          style={styles.generateButton}
          loading={generate.isPending}
          disabled={generate.isPending}
          onPress={handleGenerate}
        >
          Сгенерировать занятия на семестр
        </Button>
      ) : null}
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
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  list: {
    padding: 16,
    gap: 20,
    flexGrow: 1,
  },
  daySection: {
    gap: 6,
  },
  dayTitle: {
    opacity: 0.8,
  },
  emptyDay: {
    opacity: 0.5,
    fontStyle: 'italic',
  },
  pairRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    // borderBottomColor set inline from `theme.colors.outlineVariant` — a fixed hex here wouldn't
    // adapt to dark mode (ROADMAP.md "Фаза 8").
  },
  pairInfo: {
    flex: 1,
    gap: 2,
  },
  muted: {
    opacity: 0.6,
  },
  pairActions: {
    flexDirection: 'row',
  },
  generateButton: {
    margin: 16,
  },
});
