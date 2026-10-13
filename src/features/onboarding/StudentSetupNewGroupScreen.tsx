import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { ApiError } from '../../api/errors';
import { ErrorBanner } from '../../components/ErrorBanner';
import { StudentStackScreenProps } from '../../navigation/types';
import { libraryColors, libraryFonts } from '../../theme/library';
import { useFacultyQuery, useOwnStudentQuery, useUniversityQuery } from '../profile/hooks';
import { useCreateOwnGroupMutation, useUpdateOwnStudentMutation } from './hooks';
import { StepHeader, StepTextField, stepStyles } from './RegistrationStep';
import { firstUnfilledSetupStep } from './studentSetup';

const NAME_MAX_LENGTH = 64;
const FULL_NAME_MAX_LENGTH = 255;

/**
 * Step X of student registration (PLAN_FINISHED_01.MD, раздел 9.1): the student's group isn't in the list of
 * step 6, so they create it themselves and join it right away — no administrator involved. The
 * faculty and the year come from the saved profile and can only be changed by going back.
 */
export function StudentSetupNewGroupScreen({ navigation, route }: StudentStackScreenProps<'SetupNewGroup'>) {
  const student = useOwnStudentQuery();
  const university = useUniversityQuery(student.data?.universityId ?? undefined);
  const faculty = useFacultyQuery(student.data?.facultyId ?? undefined);
  const yearNumber = student.data?.yearNumber;

  const [name, setName] = useState(route.params?.name ?? '');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  /** A group with the entered name that already exists on this year (`409`) — offered instead. */
  const [existing, setExisting] = useState<{ id: string; name: string } | null>(null);

  const create = useCreateOwnGroupMutation();
  const update = useUpdateOwnStudentMutation();
  const busy = create.isPending || update.isPending;

  // The form needs a faculty and a year — without them the wizard resumes further up the chain.
  useEffect(() => {
    if (student.data && (!student.data.facultyId || student.data.yearNumber == null)) {
      navigation.replace(firstUnfilledSetupStep(student.data) ?? 'SetupDone');
    }
  }, [student.data, navigation]);

  const trimmedName = name.trim();

  const onChangeName = (text: string) => {
    setName(text);
    setExisting(null);
  };

  const onSubmit = async () => {
    if (!trimmedName || busy) return;
    setError(null);
    setExisting(null);
    try {
      await create.mutateAsync({ name: trimmedName, fullName: fullName.trim() || undefined });
      // Replaced, not pushed: «Назад» from the final screen must not return to a filled-in form.
      navigation.replace('SetupDone');
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && e.field === 'name' && e.existingId) {
        setExisting({ id: e.existingId, name: trimmedName });
      } else if (e instanceof ApiError && e.status === 404) {
        // The faculty disappeared: reload the profile, the effect above then resumes the wizard.
        setError('Факультет больше недоступен — выберите другой.');
        student.refetch();
      } else {
        setError(e instanceof Error ? e.message : 'Не удалось создать группу. Попробуйте ещё раз.');
        // A deleted faculty is cleared from the profile, and then the server answers `422`, not
        // `404`: the reloaded profile sends the wizard back up through the same effect.
        if (e instanceof ApiError && e.status === 422) student.refetch();
      }
    }
  };

  const onPickExisting = async () => {
    if (!existing || busy) return;
    setError(null);
    try {
      await update.mutateAsync({ groupId: existing.id });
      navigation.replace('SetupDone');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить. Попробуйте ещё раз.');
    }
  };

  const context = [
    university.data?.name,
    faculty.data?.name,
    yearNumber != null ? `${yearNumber} курс` : undefined,
  ].filter(Boolean);

  return (
    <View style={stepStyles.screen}>
      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <StepHeader
          step={6}
          title="Новая группа"
          subtitle="Группу сразу увидят однокурсники — им останется выбрать её из списка"
        />

        {context.length > 0 ? (
          <View style={styles.context}>
            {context.map((line) => (
              <Text key={line} style={styles.contextLine}>
                {line}
              </Text>
            ))}
          </View>
        ) : null}

        <StepTextField
          label="Название группы"
          value={name}
          onChangeText={onChangeName}
          placeholder="У530"
          maxLength={NAME_MAX_LENGTH}
          autoCapitalize="characters"
          errorText={existing ? 'Такая группа уже есть' : undefined}
        />
        {existing ? (
          <Button
            mode="outlined"
            onPress={onPickExisting}
            loading={update.isPending}
            disabled={busy}
            textColor={libraryColors.terracottaButton}
            style={styles.pickExisting}
          >
            Выбрать её
          </Button>
        ) : null}

        <StepTextField
          label="Полная расшифровка названия (необязательно)"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Разработка программных и информационных систем"
          maxLength={FULL_NAME_MAX_LENGTH}
        />
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
          Создать группу
        </Button>
        <Button
          mode="text"
          onPress={() => navigation.navigate('SetupDone')}
          disabled={busy}
          textColor={libraryColors.terracottaButton}
          labelStyle={stepStyles.footerLinkLabel}
        >
          Завершить без группы
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
    gap: 2,
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
