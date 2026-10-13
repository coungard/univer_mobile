import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { ApiError } from '../../api/errors';
import { PairInput, Weekday, WeekParity } from '../../api/types';
import { ErrorBanner } from '../../components/ErrorBanner';
import { SelectField } from '../../components/SelectField';
import { StudentStackScreenProps } from '../../navigation/types';
import { useAllCoursesQuery } from '../courses/hooks';
import { Hint } from '../hints/Hint';
import { useNewcomer } from '../hints/useNewcomer';
import { useGroupAcademicPathQuery, useOwnStudentQuery } from '../profile/hooks';
import {
  useBellScheduleEntriesQuery,
  useCreatePairMutation,
  useGenerateSemesterLecturesMutation,
  useGroupPairsQuery,
  usePairQuery,
  useUpdatePairMutation,
  useWeekScheduleCycleQuery,
} from './hooks';
import { PairForm, pairFormSchema } from './pairFormSchema';

type Props = StudentStackScreenProps<'PairForm'>;

// Exported for `GroupScheduleScreen`, which needs the same day/parity labels to display a `Pair`
// read-only — one source of truth for the enum -> label mapping instead of two copies drifting apart.
export const DAY_OPTIONS = [
  { label: 'Понедельник', value: 'MONDAY' },
  { label: 'Вторник', value: 'TUESDAY' },
  { label: 'Среда', value: 'WEDNESDAY' },
  { label: 'Четверг', value: 'THURSDAY' },
  { label: 'Пятница', value: 'FRIDAY' },
];

export const PARITY_OPTIONS = [
  { label: 'Каждую неделю', value: 'BOTH' },
  { label: 'Нечётная неделя', value: 'ODD' },
  { label: 'Чётная неделя', value: 'EVEN' },
];

/**
 * Форма заполнения одного `Pair` — студент своей группы, пока цикл в `DRAFT` (`UI_UX.md` раздел 4).
 * Курс — из полного каталога (`GET /courses`); время начала/окончания не запрашивается — форма берёт
 * его из звонков университета студента по `pairNumber` и передаёт сама: сервер ищет звонки по кафедре
 * предмета и для предмета без кафедры отвечает `422` (univer#98). Новая пара сразу превращается в
 * занятия на семестр, и открывается расписание с первым из них (`PLAN.md`, M28); кафедра/
 * преподаватель/группы — не поля формы: `teacherId` берётся из выбранного курса, `groupIds` всегда
 * `[student.groupId]` (см. вопросы в `UI_UX.md` разделе 7 — оба зафиксированы для этой реализации).
 */
export function PairFormScreen({ route, navigation }: Props) {
  const { pairId } = route.params ?? {};
  const isEdit = pairId !== undefined;

  const student = useOwnStudentQuery();
  const academicPath = useGroupAcademicPathQuery(student.data?.groupId ?? undefined);
  const cycle = useWeekScheduleCycleQuery(academicPath.group?.semesterId);
  const existingPair = usePairQuery(pairId);
  const courses = useAllCoursesQuery();
  const bellSchedule = useBellScheduleEntriesQuery(student.data?.universityId ?? undefined);

  const createPair = useCreatePairMutation(student.data?.groupId ?? undefined);
  const updatePair = useUpdatePairMutation(student.data?.groupId ?? undefined);
  const generate = useGenerateSemesterLecturesMutation();
  const groupPairs = useGroupPairsQuery(student.data?.groupId ?? undefined);
  const newcomer = useNewcomer();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PairForm>({
    resolver: zodResolver(pairFormSchema),
    // «Каждую неделю» is what most pairs are, so a new one starts with it.
    defaultValues: { dayOfWeek: '', weekParity: isEdit ? '' : 'BOTH', pairNumber: '', courseId: '', room: '' },
  });

  useEffect(() => {
    if (existingPair.data) {
      reset({
        dayOfWeek: existingPair.data.dayOfWeek,
        weekParity: existingPair.data.weekParity,
        pairNumber: String(existingPair.data.pairNumber),
        courseId: existingPair.data.courseId,
        room: existingPair.data.room ?? '',
      });
    }
  }, [existingPair.data, reset]);

  const courseOptions = useMemo(
    () => (courses.data ?? []).map((c) => ({ label: c.title, value: c.id })),
    [courses.data],
  );

  const pairNumberValue = watch('pairNumber');
  const timePreview = useMemo(() => {
    const number = Number(pairNumberValue);
    if (!number) return null;
    const entry = (bellSchedule.data ?? []).find((e) => e.pairNumber === number);
    return entry ? `${entry.startTime.slice(0, 5)}–${entry.endTime.slice(0, 5)}` : null;
  }, [pairNumberValue, bellSchedule.data]);

  if (student.isLoading || academicPath.isLoading || cycle.isLoading || (isEdit && existingPair.isLoading)) {
    return (
      <View style={styles.center}>
        <Text>Загрузка…</Text>
      </View>
    );
  }

  // Defensive — `GroupScheduleScreen` hides the entry points to this screen once the cycle is
  // `AGREED` or missing, but a stale back-navigation could still land here.
  if (!cycle.data || cycle.data.status === 'AGREED') {
    return (
      <View style={styles.center}>
        <Text variant="titleMedium" style={styles.centerTitle}>
          Расписание согласовано
        </Text>
        <Text variant="bodyMedium" style={styles.centerText}>
          Изменения больше нельзя вносить самостоятельно — обратитесь к администратору.
        </Text>
      </View>
    );
  }

  const cycleId = cycle.data.id;

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    if (!student.data?.groupId) return;

    const selectedCourse = courses.data?.find((c) => c.id === values.courseId);
    const bell = (bellSchedule.data ?? []).find((e) => e.pairNumber === Number(values.pairNumber));
    const payload: PairInput = {
      weekScheduleCycleId: cycleId,
      dayOfWeek: values.dayOfWeek as Weekday,
      weekParity: values.weekParity as WeekParity,
      pairNumber: Number(values.pairNumber),
      // Without an entry for this number the times are left to the server, as before.
      startTime: bell?.startTime,
      endTime: bell?.endTime,
      courseId: values.courseId,
      teacherId: selectedCourse?.teacherId,
      room: values.room || undefined,
      groupIds: [student.data.groupId],
    };

    try {
      if (isEdit && pairId) {
        // Lectures of an edited pair are left alone: the server keeps the old ones (univer#99), so
        // generating here would only add a second set next to them.
        await updatePair.mutateAsync({ id: pairId, pair: payload });
        navigation.goBack();
        return;
      }
      const firstPair = (groupPairs.data ?? []).length === 0;
      const pair = await createPair.mutateAsync(payload);
      let created;
      try {
        created = await generate.mutateAsync(cycleId);
      } catch {
        // The pair is saved; «Расписание группы» still has the button that creates the lectures.
        Alert.alert(
          'Пара сохранена',
          'Занятия по ней создать не удалось. Нажмите «Сгенерировать занятия на семестр» в расписании группы.',
        );
        navigation.goBack();
        return;
      }
      const own = created
        .filter((lecture) => lecture.sourcePairId === pair.id)
        .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
      // The nearest lecture still ahead; a semester that is over only has past ones.
      const now = new Date();
      const shown = own.find((lecture) => new Date(lecture.scheduledTime) >= now) ?? own[own.length - 1];
      navigation.popTo('Tabs', { screen: 'Schedule', params: { showLectureId: shown?.id, firstPair } });
    } catch (error) {
      if (error instanceof ApiError && error.status === 400 && error.fieldErrors) {
        Object.entries(error.fieldErrors).forEach(([field, message]) => {
          setError(field as keyof PairForm, { message });
        });
        return;
      }
      // Covers the 422 teacher/room-conflict case too (UI_UX.md принцип 4) — `error.message` already
      // includes the conflicting pair's id/time, so surfacing it as-is is a real, actionable error.
      setSubmitError(
        error instanceof ApiError ? error.message : 'Не удалось сохранить занятие. Попробуйте ещё раз.',
      );
    }
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ErrorBanner message={submitError} onDismiss={() => setSubmitError(null)} />

      <Text variant="headlineSmall" style={styles.title}>
        {isEdit ? 'Изменить занятие' : 'Добавить занятие'}
      </Text>

      <Controller
        control={control}
        name="dayOfWeek"
        render={({ field }) => (
          <View style={styles.field}>
            <SelectField
              label="День недели"
              value={field.value || null}
              options={DAY_OPTIONS}
              onChange={field.onChange}
              error={!!errors.dayOfWeek}
            />
            <HelperText type="error" visible={!!errors.dayOfWeek}>
              {errors.dayOfWeek?.message}
            </HelperText>
          </View>
        )}
      />

      <Controller
        control={control}
        name="weekParity"
        render={({ field }) => (
          <View style={styles.field}>
            <SelectField
              label="Чётность недели"
              value={field.value || null}
              options={PARITY_OPTIONS}
              onChange={field.onChange}
              error={!!errors.weekParity}
            />
            <HelperText type="error" visible={!!errors.weekParity}>
              {errors.weekParity?.message}
            </HelperText>
          </View>
        )}
      />

      <Controller
        control={control}
        name="pairNumber"
        render={({ field }) => (
          <View style={styles.field}>
            <TextInput
              label="Номер пары"
              value={field.value}
              onChangeText={field.onChange}
              keyboardType="number-pad"
              error={!!errors.pairNumber}
            />
            <HelperText type={errors.pairNumber ? 'error' : 'info'} visible>
              {errors.pairNumber?.message ??
                (timePreview ? `Время по звонкам: ${timePreview}` : 'Время подставится по звонкам университета')}
            </HelperText>
          </View>
        )}
      />

      <Controller
        control={control}
        name="courseId"
        render={({ field }) => (
          <View style={styles.field}>
            <SelectField
              label="Курс"
              value={field.value || null}
              options={courseOptions}
              onChange={field.onChange}
              error={!!errors.courseId}
              disabled={courses.isLoading}
              emptyLabel={courses.isLoading ? 'Загрузка…' : 'Нет доступных курсов'}
            />
            <HelperText type="error" visible={!!errors.courseId}>
              {errors.courseId?.message}
            </HelperText>
          </View>
        )}
      />

      <Controller
        control={control}
        name="room"
        render={({ field }) => (
          <View style={styles.field}>
            <TextInput label="Аудитория (необязательно)" value={field.value ?? ''} onChangeText={field.onChange} />
          </View>
        )}
      />

      {/* On the button, not on a field: the bubble opens under it, where it covers nothing. */}
      <Hint
        id="pair-form"
        stage={2}
        text="Выберите день, номер пары и предмет. После сохранения пара появится в расписании на весь семестр."
        active={!isEdit && newcomer.kind === 'newcomer' && newcomer.missing === 'pair'}
        style={styles.submit}
      >
        <Button mode="contained" onPress={onSubmit} loading={isSubmitting} disabled={isSubmitting}>
          Сохранить
        </Button>
      </Hint>
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
    gap: 8,
    paddingHorizontal: 24,
  },
  centerTitle: {
    textAlign: 'center',
  },
  centerText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  title: {
    marginBottom: 16,
  },
  field: {
    marginBottom: 4,
  },
  submit: {
    marginTop: 16,
  },
});
