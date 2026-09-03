import React, { useMemo } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PairDto } from '../../api/types';
import { EmptyState } from '../../components/EmptyState';
import { StudentStackScreenProps } from '../../navigation/types';
import { useCoursesQuery } from '../courses/hooks';
import { useGroupAcademicPathQuery, useOwnStudentQuery, useSemesterQuery } from '../profile/hooks';
import { DAY_OPTIONS, PARITY_OPTIONS } from './PairFormScreen';
import {
  useBellScheduleEntriesQuery,
  useDeletePairMutation,
  useGenerateSemesterLecturesMutation,
  useGroupPairsQuery,
  useWeekScheduleCycleQuery,
} from './hooks';

type Props = StudentStackScreenProps<'GroupSchedule'>;

const DAY_LABELS = Object.fromEntries(DAY_OPTIONS.map((o) => [o.value, o.label])) as Record<string, string>;
const PARITY_LABELS = Object.fromEntries(PARITY_OPTIONS.map((o) => [o.value, o.label])) as Record<string, string>;
const DAY_ORDER = DAY_OPTIONS.map((o) => o.value);

/**
 * «Расписание группы» — студент заполняет `Pair` своей группы и запускает генерацию `Lecture`
 * (`UI_UX.md` раздел 4). Список по дням, как и `ScheduleScreen`, не жёсткая сетка день×номер пары —
 * та же причина, что и там: `weekParity` может дать две разные пары на один день+номер (ODD/EVEN
 * недели), сетка усложнила бы отображение без реальной пользы для MVP.
 */
export function GroupScheduleScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const student = useOwnStudentQuery();
  const academicPath = useGroupAcademicPathQuery(student.data?.groupId);
  const semester = useSemesterQuery(academicPath.group?.semesterId);
  const cycle = useWeekScheduleCycleQuery(academicPath.group?.semesterId);
  const pairs = useGroupPairsQuery(student.data?.groupId);
  const courses = useCoursesQuery(null);
  const bellSchedule = useBellScheduleEntriesQuery(student.data?.universityId);

  const deletePair = useDeletePairMutation(student.data?.groupId);
  const generate = useGenerateSemesterLecturesMutation();

  const courseTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of courses.data ?? []) map.set(c.id, c.title);
    return map;
  }, [courses.data]);

  const timeFor = (pairNumber: number) => {
    const entry = (bellSchedule.data ?? []).find((e) => e.pairNumber === pairNumber);
    return entry ? `${entry.startTime.slice(0, 5)}–${entry.endTime.slice(0, 5)}` : null;
  };

  const isLoading = student.isLoading || academicPath.isLoading || cycle.isLoading || pairs.isLoading;

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text>Загрузка расписания группы…</Text>
      </View>
    );
  }

  if (!cycle.data) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <EmptyState
          title="Расписание семестра ещё не открыто"
          description="Сначала администратор должен открыть расписание семестра — тогда здесь появится форма заполнения."
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
    Alert.alert('Удалить занятие?', `${DAY_LABELS[pair.dayOfWeek]}, пара ${pair.pairNumber}`, [
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
    ]);
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
          <Button mode="contained-tonal" compact onPress={() => navigation.navigate('PairForm')}>
            + Добавить
          </Button>
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
                <View key={pair.id} style={styles.pairRow}>
                  <View style={styles.pairInfo}>
                    <Text variant="bodyMedium">
                      Пара {pair.pairNumber} · {PARITY_LABELS[pair.weekParity]}
                    </Text>
                    <Text variant="bodyMedium">{courseTitleById.get(pair.courseId) ?? 'Курс'}</Text>
                    <Text style={styles.muted}>
                      {[timeFor(pair.pairNumber), pair.room ? `ауд. ${pair.room}` : null].filter(Boolean).join(' · ') ||
                        '—'}
                    </Text>
                  </View>
                  {isDraft ? (
                    <View style={styles.pairActions}>
                      <Button compact onPress={() => navigation.navigate('PairForm', { pairId: pair.id })}>
                        Изменить
                      </Button>
                      <Button compact textColor="#B3261E" onPress={() => handleDelete(pair)}>
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
    borderBottomColor: '#0002',
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
