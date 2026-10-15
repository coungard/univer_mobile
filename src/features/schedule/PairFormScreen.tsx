import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { ApiError } from '../../api/errors';
import { PairInput, Weekday, WeekParity } from '../../api/types';
import { ErrorBanner } from '../../components/ErrorBanner';
import { QueryErrorState } from '../../components/QueryErrorState';
import { SelectField } from '../../components/SelectField';
import { StudentStackScreenProps } from '../../navigation/types';
import { useCourseQuery, useFacultyCoursesQuery } from '../courses/hooks';
import { Hint } from '../hints/Hint';
import { useNewcomer } from '../hints/useNewcomer';
import { useOwnStudentQuery } from '../profile/hooks';
import {
  useCreatePairMutation,
  useEffectiveBellScheduleQuery,
  useGenerateSemesterLecturesMutation,
  useGroupPairsQuery,
  useOwnWeekScheduleCycleQuery,
  usePairQuery,
  useUpdatePairMutation,
} from './hooks';
import { NewCourseDialog } from './NewCourseDialog';
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
  { label: 'Суббота', value: 'SATURDAY' },
  { label: 'Воскресенье', value: 'SUNDAY' },
];

export const PARITY_OPTIONS = [
  { label: 'Каждую неделю', value: 'BOTH' },
  { label: 'Нечётная неделя', value: 'ODD' },
  { label: 'Чётная неделя', value: 'EVEN' },
];

/**
 * Форма заполнения одного `Pair` — студент своей группы, пока цикл в `DRAFT` (`UI_UX.md` раздел 4).
 * Предмет — из предметов факультета студента (`GET /courses?facultyId=`), недостающий студент
 * добавляет сам — последним пунктом списка («Добавить свой предмет», `PLAN.md`, M26; issue #57). Время начала/окончания не запрашивается и
 * не передаётся: номер пары выбирается из звонков, действующих для университета студента, и по ним же
 * время подставляет сервер (M27). Новая пара сразу превращается в занятия на семестр, и открывается
 * расписание с первым из них (M28); кафедра/преподаватель/группы — не поля формы: `teacherId` берётся
 * из выбранного предмета, `groupIds` всегда `[student.groupId]` (см. вопросы в `UI_UX.md` разделе 7 —
 * оба зафиксированы для этой реализации).
 */
export function PairFormScreen({ route, navigation }: Props) {
  const { pairId } = route.params ?? {};
  const isEdit = pairId !== undefined;

  const student = useOwnStudentQuery();
  const cycle = useOwnWeekScheduleCycleQuery(student.data?.groupId ?? undefined);
  const existingPair = usePairQuery(pairId);
  const courses = useFacultyCoursesQuery(student.data?.facultyId ?? undefined);
  // A pair saved earlier may point at a subject outside the faculty's list — it still needs a title.
  const pairCourse = useCourseQuery(existingPair.data?.courseId);
  const bellSchedule = useEffectiveBellScheduleQuery(student.data?.universityId ?? undefined);

  const createPair = useCreatePairMutation(student.data?.groupId ?? undefined);
  const updatePair = useUpdatePairMutation(student.data?.groupId ?? undefined);
  const generate = useGenerateSemesterLecturesMutation();
  const groupPairs = useGroupPairsQuery(student.data?.groupId ?? undefined);
  const newcomer = useNewcomer();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [courseDialog, setCourseDialog] = useState(false);
  // Subjects picked through «Добавить свой предмет» — on the form before the list is refetched.
  const [addedCourses, setAddedCourses] = useState<{ id: string; title: string }[]>([]);
  const [courseNote, setCourseNote] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    reset,
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

  const courseOptions = useMemo(() => {
    const options = (courses.data ?? []).map((c) => ({ label: c.title, value: c.id }));
    const extra = pairCourse.data ? [...addedCourses, pairCourse.data] : addedCourses;
    for (const course of extra) {
      if (!options.some((o) => o.value === course.id)) options.push({ label: course.title, value: course.id });
    }
    return options;
  }, [courses.data, addedCourses, pairCourse.data]);

  // Only the numbers the university has a time for: any other the server rejects (`422`).
  const pairNumberOptions = useMemo(() => {
    const options = (bellSchedule.data ?? []).map((e) => ({
      label: `${e.pairNumber} пара · ${e.startTime.slice(0, 5)}–${e.endTime.slice(0, 5)}`,
      value: String(e.pairNumber),
    }));
    const saved = existingPair.data ? String(existingPair.data.pairNumber) : null;
    if (saved && !options.some((o) => o.value === saved)) options.push({ label: `${saved} пара`, value: saved });
    return options;
  }, [bellSchedule.data, existingPair.data]);

  if (student.isLoading || cycle.isLoading || (isEdit && existingPair.isLoading)) {
    return (
      <View style={styles.center}>
        <Text>Загрузка…</Text>
      </View>
    );
  }

  if (!cycle.data) {
    return (
      <View style={styles.center}>
        <QueryErrorState error={cycle.error} onRetry={() => cycle.refetch()} />
      </View>
    );
  }

  // Defensive — `GroupScheduleScreen` hides the entry points to this screen once the cycle is
  // `AGREED`, but a stale back-navigation could still land here.
  if (cycle.data.status === 'AGREED') {
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

    const selectedCourse =
      courses.data?.find((c) => c.id === values.courseId) ??
      (pairCourse.data?.id === values.courseId ? pairCourse.data : undefined);
    // No `startTime`/`endTime`: the server takes them from the same bell schedule the form shows.
    const payload: PairInput = {
      weekScheduleCycleId: cycleId,
      dayOfWeek: values.dayOfWeek as Weekday,
      weekParity: values.weekParity as WeekParity,
      pairNumber: Number(values.pairNumber),
      courseId: values.courseId,
      teacherId: selectedCourse?.teacherId,
      room: values.room || undefined,
      groupIds: [student.data.groupId],
    };

    try {
      if (isEdit && pairId) {
        // The server moves the pair's lectures itself (univer#99) — but only if it has any, so a
        // pair saved without them gets them here. Repeating the call adds nothing; a failure leaves
        // the button on «Расписание группы».
        await updatePair.mutateAsync({ id: pairId, pair: payload });
        await generate.mutateAsync(cycleId).catch(() => undefined);
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
            <SelectField
              label="Номер пары"
              value={field.value || null}
              options={pairNumberOptions}
              onChange={field.onChange}
              error={!!errors.pairNumber}
              disabled={bellSchedule.isLoading}
              emptyLabel={bellSchedule.isLoading ? 'Загрузка…' : 'Не удалось загрузить звонки'}
            />
            <HelperText type="error" visible={!!errors.pairNumber}>
              {errors.pairNumber?.message}
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
              label="Предмет"
              value={field.value || null}
              options={courseOptions}
              onChange={(value) => {
                setCourseNote(null);
                field.onChange(value);
              }}
              error={!!errors.courseId}
              disabled={courses.isLoading}
              action={{ label: 'Добавить свой предмет', onPress: () => setCourseDialog(true) }}
            />
            <HelperText type={errors.courseId ? 'error' : 'info'} visible={!!errors.courseId || !!courseNote}>
              {errors.courseId?.message ?? courseNote}
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
        text="Выберите день, номер пары и предмет — если предмета нет, добавьте свой прямо в списке. После сохранения пара появится в расписании на весь семестр."
        active={!isEdit && newcomer.kind === 'newcomer' && newcomer.missing === 'pair'}
        style={styles.submit}
      >
        <Button mode="contained" onPress={onSubmit} loading={isSubmitting} disabled={isSubmitting}>
          Сохранить
        </Button>
      </Hint>

      <NewCourseDialog
        visible={courseDialog}
        onDismiss={() => setCourseDialog(false)}
        onPicked={(course, existed) => {
          setAddedCourses((current) => [...current, course]);
          setValue('courseId', course.id, { shouldValidate: true });
          setCourseNote(existed ? 'Такой предмет на факультете уже есть — выбран он.' : null);
        }}
      />
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
