import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { ApiError } from '../../api/errors';
import { ErrorBanner } from '../../components/ErrorBanner';
import { StudentStackScreenProps } from '../../navigation/types';
import { libraryColors, libraryFonts } from '../../theme/library';
import { useOwnStudentQuery, useUniversityQuery } from '../profile/hooks';
import { useCreateOwnFacultyMutation, useUpdateOwnStudentMutation } from './hooks';
import { StepHeader, StepTextField, stepStyles } from './RegistrationStep';
import { firstUnfilledSetupStep } from './studentSetup';

const NAME_MAX_LENGTH = 255;

/**
 * Step Y of student registration (PLAN_FINISHED_01.MD, раздел 9.1): the student's faculty isn't in the list of
 * step 4, so they create it themselves and it is saved in their profile right away — no
 * administrator involved. The university comes from the saved profile and can only be changed by
 * going back.
 */
export function StudentSetupNewFacultyScreen({ navigation, route }: StudentStackScreenProps<'SetupNewFaculty'>) {
  const student = useOwnStudentQuery();
  const university = useUniversityQuery(student.data?.universityId ?? undefined);

  const [name, setName] = useState(route.params?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  /** ID of the faculty with the entered name that already exists in this university (`409`). */
  const [existingId, setExistingId] = useState<string | null>(null);

  const create = useCreateOwnFacultyMutation();
  const update = useUpdateOwnStudentMutation();
  const busy = create.isPending || update.isPending;

  // The form needs a university — without one the wizard resumes further up the chain.
  useEffect(() => {
    if (student.data && !student.data.universityId) {
      navigation.replace(firstUnfilledSetupStep(student.data) ?? 'SetupDone');
    }
  }, [student.data, navigation]);

  const trimmedName = name.trim();

  const onChangeName = (text: string) => {
    setName(text);
    setExistingId(null);
  };

  const onSubmit = async () => {
    if (!trimmedName || busy) return;
    setError(null);
    setExistingId(null);
    try {
      await create.mutateAsync({ name: trimmedName });
      // Replaced, not pushed: «Назад» from step 5 leads to the list of step 4, where the new
      // faculty is already selected, not to a filled-in form.
      navigation.replace('SetupYear');
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && e.field === 'name' && e.existingId) {
        setExistingId(e.existingId);
      } else if (e instanceof ApiError && e.status === 404) {
        // The university disappeared: reload the profile, the effect above then resumes the wizard.
        setError('Университет больше недоступен — выберите другой.');
        student.refetch();
      } else {
        setError(e instanceof Error ? e.message : 'Не удалось создать факультет. Попробуйте ещё раз.');
        // A profile that lost its university in the meantime gets `422`, not `404`: the reloaded
        // profile sends the wizard back up through the same effect.
        if (e instanceof ApiError && e.status === 422) student.refetch();
      }
    }
  };

  const onPickExisting = async () => {
    if (!existingId || busy) return;
    setError(null);
    try {
      await update.mutateAsync({ facultyId: existingId });
      navigation.replace('SetupYear');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить. Попробуйте ещё раз.');
    }
  };

  return (
    <View style={stepStyles.screen}>
      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <StepHeader
          step={4}
          title="Новый факультет"
          subtitle="Факультет сразу увидят другие студенты университета — им останется выбрать его из списка"
        />

        {university.data?.name ? (
          <View style={styles.context}>
            <Text style={styles.contextLine}>{university.data.name}</Text>
          </View>
        ) : null}

        <StepTextField
          label="Название факультета"
          value={name}
          onChangeText={onChangeName}
          placeholder="Факультет информатики и управления"
          maxLength={NAME_MAX_LENGTH}
          autoCapitalize="sentences"
          errorText={existingId ? 'Такой факультет уже есть' : undefined}
        />
        {existingId ? (
          <Button
            mode="outlined"
            onPress={onPickExisting}
            loading={update.isPending}
            disabled={busy}
            textColor={libraryColors.terracottaButton}
            style={styles.pickExisting}
          >
            Выбрать его
          </Button>
        ) : null}
      </ScrollView>

      <View style={stepStyles.footer}>
        <Button
          mode="contained"
          onPress={onSubmit}
          loading={create.isPending}
          disabled={!trimmedName || busy}
          buttonColor={libraryColors.terracottaButton}
          textColor={libraryColors.cream}
          style={stepStyles.primaryButton}
          contentStyle={stepStyles.primaryButtonContent}
          labelStyle={stepStyles.primaryButtonLabel}
        >
          Создать факультет
        </Button>
        <Button
          mode="text"
          onPress={() => navigation.navigate('SetupDone')}
          disabled={busy}
          textColor={libraryColors.terracottaButton}
          labelStyle={stepStyles.footerLinkLabel}
        >
          Завершить без факультета
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  context: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: libraryColors.border,
  },
  contextLine: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 12.5,
    color: libraryColors.inkMuted,
  },
  pickExisting: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    marginTop: -4,
  },
});
