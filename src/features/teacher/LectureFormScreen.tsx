import { zodResolver } from '@hookform/resolvers/zod';
import React, { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, Text, TextInput } from 'react-native-paper';
import { ApiError } from '../../api/errors';
import { LectureInput } from '../../api/types';
import { ErrorBanner } from '../../components/ErrorBanner';
import { SelectField } from '../../components/SelectField';
import { TeacherStackScreenProps } from '../../navigation/types';
import { useCoursesQuery, useOwnCoursesQuery } from '../courses/hooks';
import { useOwnUserId } from '../profile/hooks';
import { useCreateLectureMutation, useGroupsByIds, useOwnPairsQuery } from './hooks';
import { LectureForm, lectureFormSchema } from './lectureFormSchema';

type Props = TeacherStackScreenProps<'LectureForm'>;

/**
 * Ручное создание занятия — `POST /lectures`, без исходного `Pair` (ROADMAP.md "Фаза 6"). Более
 * редкий путь по сравнению с генерацией из шаблона (`TeacherLecturesScreen`'s «На дату»/«Сгенерировать
 * на семестр»): здесь всё — курс, дата/время, группы — вводится вручную, а не копируется из `Pair`.
 */
export function LectureFormScreen({ navigation }: Props) {
  const teacherId = useOwnUserId();
  const courses = useOwnCoursesQuery();
  const pairs = useOwnPairsQuery();
  const allCourses = useCoursesQuery(null);
  const createLecture = useCreateLectureMutation();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LectureForm>({
    resolver: zodResolver(lectureFormSchema),
    defaultValues: {
      title: '',
      content: '',
      courseId: '',
      date: '',
      time: '',
      durationMinutes: '90',
      room: '',
      groupIds: [],
    },
  });

  // Union with the courses of the teacher's own `Pair` templates, not just `useOwnCoursesQuery()` —
  // confirmed live that `CourseDto.teacherId` can be unset for a course this teacher actually has
  // pairs/lectures on (see `features/teacher/hooks.ts`'s `useTeacherLecturesQuery` doc comment), so
  // relying on it alone here would leave this field with nothing to pick for a real teacher. Titles
  // come from the full catalogue for the same reason.
  const courseOptions = useMemo(() => {
    const ids = new Set((courses.data ?? []).map((c) => c.id));
    for (const pair of pairs.data ?? []) ids.add(pair.courseId);
    const titleById = new Map((allCourses.data ?? []).map((c) => [c.id, c.title]));
    return Array.from(ids).map((id) => ({ label: titleById.get(id) ?? 'Курс', value: id }));
  }, [courses.data, pairs.data, allCourses.data]);

  const selectedCourseId = watch('courseId');

  // No endpoint links a `Course` to its groups directly (see API.md) — the teacher's own `Pair`
  // templates for this course are the only source of "which groups actually take this course" this
  // screen has, same reasoning as `TeacherLecturesScreen`'s «Шаблоны» section.
  const candidateGroupIds = useMemo(() => {
    const ids = new Set<string>();
    for (const pair of pairs.data ?? []) {
      if (pair.courseId === selectedCourseId) pair.groupIds.forEach((id) => ids.add(id));
    }
    return Array.from(ids);
  }, [pairs.data, selectedCourseId]);
  const candidateGroups = useGroupsByIds(candidateGroupIds);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    if (!teacherId) return;

    const payload: LectureInput = {
      title: values.title,
      content: values.content || undefined,
      scheduledTime: `${values.date}T${values.time}:00`,
      durationMinutes: Number(values.durationMinutes),
      courseId: values.courseId,
      teacherId,
      room: values.room || undefined,
      groupIds: values.groupIds,
    };

    try {
      await createLecture.mutateAsync(payload);
      navigation.goBack();
    } catch (error) {
      if (error instanceof ApiError && error.status === 400 && error.fieldErrors) {
        Object.entries(error.fieldErrors).forEach(([field, message]) => {
          if (field in values) setError(field as keyof LectureForm, { message });
        });
        return;
      }
      setSubmitError(
        error instanceof ApiError ? error.message : 'Не удалось сохранить занятие. Попробуйте ещё раз.',
      );
    }
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ErrorBanner message={submitError} onDismiss={() => setSubmitError(null)} />

      <Text variant="headlineSmall" style={styles.title}>
        Добавить занятие
      </Text>

      <Controller
        control={control}
        name="title"
        render={({ field }) => (
          <View style={styles.field}>
            <TextInput label="Название" value={field.value} onChangeText={field.onChange} error={!!errors.title} />
            <HelperText type="error" visible={!!errors.title}>
              {errors.title?.message}
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
              disabled={courses.isLoading || pairs.isLoading}
              emptyLabel={courses.isLoading || pairs.isLoading ? 'Загрузка…' : 'Нет доступных курсов'}
            />
            <HelperText type="error" visible={!!errors.courseId}>
              {errors.courseId?.message}
            </HelperText>
          </View>
        )}
      />

      <View style={styles.row}>
        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <View style={[styles.field, styles.rowItem]}>
              <TextInput
                label="Дата (ГГГГ-ММ-ДД)"
                value={field.value}
                onChangeText={field.onChange}
                error={!!errors.date}
              />
              <HelperText type="error" visible={!!errors.date}>
                {errors.date?.message}
              </HelperText>
            </View>
          )}
        />
        <Controller
          control={control}
          name="time"
          render={({ field }) => (
            <View style={[styles.field, styles.rowItem]}>
              <TextInput label="Время (ЧЧ:ММ)" value={field.value} onChangeText={field.onChange} error={!!errors.time} />
              <HelperText type="error" visible={!!errors.time}>
                {errors.time?.message}
              </HelperText>
            </View>
          )}
        />
      </View>

      <Controller
        control={control}
        name="durationMinutes"
        render={({ field }) => (
          <View style={styles.field}>
            <TextInput
              label="Длительность, мин"
              value={field.value}
              onChangeText={field.onChange}
              keyboardType="number-pad"
              error={!!errors.durationMinutes}
            />
            <HelperText type="error" visible={!!errors.durationMinutes}>
              {errors.durationMinutes?.message}
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

      <Controller
        control={control}
        name="content"
        render={({ field }) => (
          <View style={styles.field}>
            <TextInput
              label="Содержание (необязательно)"
              value={field.value ?? ''}
              onChangeText={field.onChange}
              multiline
            />
          </View>
        )}
      />

      <Controller
        control={control}
        name="groupIds"
        render={({ field }) => (
          <View style={styles.field}>
            <Text variant="labelLarge" style={styles.groupsLabel}>
              Группы
            </Text>
            {!selectedCourseId ? (
              <HelperText type="info" visible>
                Сначала выберите курс.
              </HelperText>
            ) : candidateGroups.isLoading ? (
              <HelperText type="info" visible>
                Загрузка групп…
              </HelperText>
            ) : candidateGroups.data.length === 0 ? (
              <HelperText type="info" visible>
                Для этого курса ещё нет ни одного шаблона занятия (Pair) — группы неизвестны.
              </HelperText>
            ) : (
              <View style={styles.chips}>
                {candidateGroups.data.map((group) => {
                  const selected = field.value.includes(group.id);
                  return (
                    <Chip
                      key={group.id}
                      selected={selected}
                      onPress={() =>
                        field.onChange(
                          selected ? field.value.filter((id) => id !== group.id) : [...field.value, group.id],
                        )
                      }
                      style={styles.chip}
                    >
                      {group.name}
                    </Chip>
                  );
                })}
              </View>
            )}
            <HelperText type="error" visible={!!errors.groupIds}>
              {errors.groupIds?.message}
            </HelperText>
          </View>
        )}
      />

      <Button mode="contained" onPress={onSubmit} loading={isSubmitting} disabled={isSubmitting} style={styles.submit}>
        Сохранить
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 4,
  },
  title: {
    marginBottom: 16,
  },
  field: {
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  groupsLabel: {
    opacity: 0.6,
    marginBottom: 6,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 4,
  },
  submit: {
    marginTop: 16,
  },
});
