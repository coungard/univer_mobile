import React, { useEffect, useMemo, useState } from 'react';
import { Button } from 'react-native-paper';
import { EmptyState } from '../../components/EmptyState';
import { StudentStackScreenProps } from '../../navigation/types';
import { libraryColors } from '../../theme/library';
import { useFacultyQuery, useOwnStudentQuery } from '../profile/hooks';
import { ChoiceStep } from './ChoiceStep';
import { useGroupsQuery } from './hooks';
import { firstUnfilledSetupStep, useSaveSetupStep } from './studentSetup';

/** Below this many groups a search field is just clutter. */
const SEARCH_THRESHOLD = 8;

/**
 * Step 6 of student registration (PLAN_FINISHED_01.MD): pick a group of the saved faculty on the saved year.
 * The student joins it right away, no administrator involved. A group that isn't there — the
 * list is empty or just doesn't have it — is created by the student on `SetupNewGroup`.
 */
export function StudentSetupGroupScreen({ navigation }: StudentStackScreenProps<'SetupGroup'>) {
  const student = useOwnStudentQuery();
  const facultyId = student.data?.facultyId;
  const yearNumber = student.data?.yearNumber;
  const faculty = useFacultyQuery(facultyId ?? undefined);
  const groups = useGroupsQuery(facultyId, yearNumber);

  const [search, setSearch] = useState('');
  const [pickedId, setPickedId] = useState<string | null>(null);
  const { save, saving, error, clearError } = useSaveSetupStep(() => {
    setPickedId(null);
    groups.refetch();
  });

  // This step needs a faculty and a year — without them the wizard resumes further up the chain.
  useEffect(() => {
    if (student.data && (!student.data.facultyId || student.data.yearNumber == null)) {
      navigation.replace(firstUnfilledSetupStep(student.data) ?? 'SetupDone');
    }
  }, [student.data, navigation]);

  const all = useMemo(() => (groups.data ?? []).map((group) => ({ id: group.id, title: group.name })), [groups.data]);
  const needle = search.trim().toLowerCase();
  const items = needle ? all.filter((item) => item.title.toLowerCase().includes(needle)) : all;
  const selectedId = pickedId ?? student.data?.groupId;
  const selected = all.find((item) => item.id === selectedId) ?? null;

  const onSubmit = async () => {
    if (!selected) return;
    if (await save({ groupId: selected.id })) navigation.navigate('SetupDone');
  };

  const context = [faculty.data?.name, yearNumber != null ? `${yearNumber} курс` : undefined]
    .filter(Boolean)
    .join(' · ');

  return (
    <ChoiceStep
      step={6}
      title="Выберите группу"
      subtitle={context || 'Группы вашего факультета'}
      search={
        all.length > SEARCH_THRESHOLD
          ? { value: search, onChangeText: setSearch, placeholder: 'Название группы' }
          : undefined
      }
      isPending={student.isPending || groups.isPending}
      loadError={student.error ?? groups.error}
      onRetry={() => {
        if (student.isError) student.refetch();
        if (groups.isError) groups.refetch();
      }}
      items={items}
      empty={
        all.length === 0 ? (
          <>
            <EmptyState
              title={`На ${yearNumber} курсе пока нет групп`}
              description="Добавьте свою группу — её сразу увидят однокурсники."
            />
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('SetupNewGroup')}
              textColor={libraryColors.terracottaButton}
            >
              Создать группу
            </Button>
          </>
        ) : (
          <EmptyState title="Ничего не найдено" description="Проверьте название." />
        )
      }
      selected={selected}
      onSelect={(item) => setPickedId(item.id)}
      onSubmit={onSubmit}
      submitting={saving}
      submitError={error}
      onDismissSubmitError={clearError}
      skipLabel={all.length === 0 ? 'Завершить без группы' : 'Моей группы нет в списке'}
      onSkip={() =>
        all.length === 0
          ? navigation.navigate('SetupDone')
          : navigation.navigate('SetupNewGroup', { name: search.trim() || undefined })
      }
    />
  );
}
