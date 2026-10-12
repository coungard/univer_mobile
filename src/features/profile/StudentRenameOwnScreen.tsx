import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { ApiError } from '../../api/errors';
import { ErrorBanner } from '../../components/ErrorBanner';
import { QueryErrorState } from '../../components/QueryErrorState';
import { StudentStackScreenProps } from '../../navigation/types';
import { libraryColors, libraryFonts } from '../../theme/library';
import { useRenameOwnFacultyMutation, useRenameOwnGroupMutation } from '../onboarding/hooks';
import { StepTextField, stepStyles } from '../onboarding/RegistrationStep';
import { useFacultyQuery, useGroupAcademicPathQuery, useOwnStudentQuery } from './hooks';

const FACULTY_NAME_MAX_LENGTH = 255;
const GROUP_NAME_MAX_LENGTH = 64;
const GROUP_FULL_NAME_MAX_LENGTH = 255;

/**
 * Fixing a typo in the faculty or the group the student created themselves (PLAN.md, M19) —
 * `PUT /students/me/faculty` / `PUT /students/me/group`. The profile offers this only for entities
 * with the student's `createdByStudentId`; whether anyone else has picked the entity since is known
 * only to the server, which then answers `422` with the reason.
 */
export function StudentRenameOwnScreen({ navigation, route }: StudentStackScreenProps<'RenameOwn'>) {
  const { kind } = route.params;
  const student = useOwnStudentQuery();
  const faculty = useFacultyQuery(kind === 'faculty' ? (student.data?.facultyId ?? undefined) : undefined);
  const path = useGroupAcademicPathQuery(kind === 'group' ? student.data?.groupId : undefined);

  const current =
    kind === 'faculty'
      ? faculty.data && { name: faculty.data.name ?? '', fullName: '' }
      : path.group && { name: path.group.name, fullName: path.group.fullName ?? '' };
  const loadError = student.error ?? (kind === 'faculty' ? faculty.error : path.error);

  if (loadError) {
    return (
      <View style={[stepStyles.screen, stepStyles.centered]}>
        <QueryErrorState error={loadError} onRetry={() => student.refetch()} />
      </View>
    );
  }

  if (!current) {
    return (
      <View style={[stepStyles.screen, stepStyles.centered]}>
        <ActivityIndicator color={libraryColors.terracotta} />
      </View>
    );
  }

  return <RenameForm kind={kind} initial={current} onDone={() => navigation.goBack()} />;
}

interface RenameFormProps {
  kind: 'faculty' | 'group';
  initial: { name: string; fullName: string };
  onDone: () => void;
}

function RenameForm({ kind, initial, onDone }: RenameFormProps) {
  const [name, setName] = useState(initial.name);
  const [fullName, setFullName] = useState(initial.fullName);
  const [error, setError] = useState<string | null>(null);
  const [nameTaken, setNameTaken] = useState(false);

  const renameFaculty = useRenameOwnFacultyMutation();
  const renameGroup = useRenameOwnGroupMutation();
  const busy = renameFaculty.isPending || renameGroup.isPending;

  const trimmedName = name.trim();
  const unchanged = trimmedName === initial.name && fullName.trim() === initial.fullName;

  const onSubmit = async () => {
    if (!trimmedName || unchanged || busy) return;
    setError(null);
    setNameTaken(false);
    try {
      if (kind === 'faculty') {
        await renameFaculty.mutateAsync({ name: trimmedName });
      } else {
        // The full name is sent every time: one left out of the body is cleared on the server.
        await renameGroup.mutateAsync({ name: trimmedName, fullName: fullName.trim() || undefined });
      }
      onDone();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && e.field === 'name') {
        setNameTaken(true);
      } else {
        // A 422 carries the server's reason, e.g. the entity has been picked by other students.
        setError(e instanceof Error ? e.message : 'Не удалось сохранить. Попробуйте ещё раз.');
      }
    }
  };

  return (
    <View style={stepStyles.screen}>
      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{kind === 'faculty' ? 'Название факультета' : 'Название группы'}</Text>
        <Text style={styles.subtitle}>
          {kind === 'faculty'
            ? 'Исправить название можно, пока факультет не выбрали другие студенты.'
            : 'Исправить название можно, пока в группе нет других студентов.'}
        </Text>

        <StepTextField
          label={kind === 'faculty' ? 'Название факультета' : 'Название группы'}
          value={name}
          onChangeText={(text) => {
            setName(text);
            setNameTaken(false);
          }}
          maxLength={kind === 'faculty' ? FACULTY_NAME_MAX_LENGTH : GROUP_NAME_MAX_LENGTH}
          autoCapitalize={kind === 'faculty' ? 'sentences' : 'characters'}
          errorText={nameTaken ? (kind === 'faculty' ? 'Такой факультет уже есть' : 'Такая группа уже есть') : undefined}
        />
        {kind === 'group' ? (
          <StepTextField
            label="Полная расшифровка названия (необязательно)"
            value={fullName}
            onChangeText={setFullName}
            maxLength={GROUP_FULL_NAME_MAX_LENGTH}
          />
        ) : null}
      </ScrollView>

      <View style={stepStyles.footer}>
        <Button
          mode="contained"
          onPress={onSubmit}
          loading={busy}
          disabled={!trimmedName || unchanged || busy}
          buttonColor={libraryColors.terracottaButton}
          textColor={libraryColors.cream}
          style={stepStyles.primaryButton}
          contentStyle={stepStyles.primaryButtonContent}
          labelStyle={stepStyles.primaryButtonLabel}
        >
          Сохранить
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 12,
  },
  title: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 22,
    color: libraryColors.ink,
  },
  subtitle: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 13,
    lineHeight: 18,
    color: libraryColors.inkMuted,
  },
});
