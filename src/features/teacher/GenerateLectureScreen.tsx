import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { z } from 'zod';
import { ApiError } from '../../api/errors';
import { ErrorBanner } from '../../components/ErrorBanner';
import { TeacherStackScreenProps } from '../../navigation/types';
import { useCourseQuery } from '../courses/hooks';
import { usePairQuery } from '../schedule/hooks';
import { DAY_OPTIONS, PARITY_OPTIONS } from '../schedule/PairFormScreen';
import { useGenerateLectureMutation } from './hooks';

type Props = TeacherStackScreenProps<'GenerateLecture'>;

const DAY_LABELS = Object.fromEntries(DAY_OPTIONS.map((o) => [o.value, o.label])) as Record<string, string>;
const PARITY_LABELS = Object.fromEntries(PARITY_OPTIONS.map((o) => [o.value, o.label])) as Record<string, string>;

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Формат: ГГГГ-ММ-ДД'),
});
type Form = z.infer<typeof schema>;

/**
 * `POST /lectures/generate` для одного `Pair` — генерирует ровно одну `Lecture` на выбранную дату
 * (ROADMAP.md "Фаза 6"). В отличие от `generateSemesterLectures` (`TeacherLecturesScreen`), **не
 * идемпотентно**: повторный вызов для той же пары+даты — `422` («уже сгенерирована»), поэтому ошибка
 * показывается как есть, а не тихо проглатывается.
 */
export function GenerateLectureScreen({ route, navigation }: Props) {
  const { pairId } = route.params;
  const pair = usePairQuery(pairId);
  const course = useCourseQuery(pair.data?.courseId ?? '');
  const generate = useGenerateLectureMutation();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { date: '' } });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await generate.mutateAsync({ pairId, date: values.date });
      Alert.alert('Готово', 'Занятие создано.');
      navigation.goBack();
    } catch (error) {
      // Покрывает и «уже сгенерирована» (422), и несоответствие дня недели/чётности недели пары —
      // `error.message` в обоих случаях уже содержит конкретную причину от бэкенда.
      setSubmitError(
        error instanceof ApiError ? error.message : 'Не удалось сгенерировать занятие. Попробуйте ещё раз.',
      );
    }
  });

  if (pair.isLoading) {
    return (
      <View style={styles.center}>
        <Text>Загрузка шаблона…</Text>
      </View>
    );
  }

  if (pair.isError || !pair.data) {
    return (
      <View style={styles.center}>
        <Text>Не удалось загрузить шаблон занятия.</Text>
        <Button mode="outlined" onPress={() => pair.refetch()}>
          Повторить
        </Button>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ErrorBanner message={submitError} onDismiss={() => setSubmitError(null)} />

      <Text variant="headlineSmall" style={styles.title}>
        Сгенерировать занятие
      </Text>
      <Text variant="bodyLarge">{course.data?.title ?? '…'}</Text>
      <Text style={styles.muted}>
        {DAY_LABELS[pair.data.dayOfWeek]}, пара {pair.data.pairNumber} · {PARITY_LABELS[pair.data.weekParity]}
        {pair.data.room ? ` · ауд. ${pair.data.room}` : ''}
      </Text>

      <Controller
        control={control}
        name="date"
        render={({ field }) => (
          <View style={styles.field}>
            <TextInput
              label="Дата (ГГГГ-ММ-ДД)"
              value={field.value}
              onChangeText={field.onChange}
              error={!!errors.date}
            />
            <HelperText type={errors.date ? 'error' : 'info'} visible>
              {errors.date?.message ?? 'Дата должна соответствовать дню недели и чётности недели шаблона.'}
            </HelperText>
          </View>
        )}
      />

      <Button mode="contained" onPress={onSubmit} loading={isSubmitting} disabled={isSubmitting} style={styles.submit}>
        Сгенерировать
      </Button>
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
    gap: 12,
    paddingHorizontal: 24,
  },
  title: {
    marginBottom: 4,
  },
  muted: {
    opacity: 0.6,
    marginBottom: 16,
  },
  field: {
    marginTop: 8,
    marginBottom: 4,
  },
  submit: {
    marginTop: 16,
  },
});
