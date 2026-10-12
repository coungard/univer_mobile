import React, { useEffect, useMemo, useState } from 'react';
import { Button } from 'react-native-paper';
import { EmptyState } from '../../components/EmptyState';
import { StudentStackScreenProps } from '../../navigation/types';
import { libraryColors } from '../../theme/library';
import { useOwnStudentQuery, useUniversityQuery } from '../profile/hooks';
import { ChoiceStep } from './ChoiceStep';
import { useFacultiesQuery } from './hooks';
import { firstUnfilledSetupStep, useSaveSetupStep } from './studentSetup';

/** Below this many faculties a search field is just clutter. */
const SEARCH_THRESHOLD = 8;

/**
 * Step 4 of student registration (PLAN.md): pick a faculty of the university saved on step 3.
 * Many universities have no faculties in the catalog yet, so the empty list is an ordinary outcome
 * here. A faculty that isn't there — the list is empty or just doesn't have it — is created by the
 * student on `SetupNewFaculty`.
 */
export function StudentSetupFacultyScreen({ navigation }: StudentStackScreenProps<'SetupFaculty'>) {
  const student = useOwnStudentQuery();
  const universityId = student.data?.universityId;
  const university = useUniversityQuery(universityId ?? undefined);
  const faculties = useFacultiesQuery(universityId);

  const [search, setSearch] = useState('');
  const [pickedId, setPickedId] = useState<string | null>(null);
  const { save, saving, error, clearError } = useSaveSetupStep(() => {
    setPickedId(null);
    faculties.refetch();
  });

  // This step needs a university — without one the wizard resumes further up the chain.
  useEffect(() => {
    if (student.data && !student.data.universityId) {
      navigation.replace(firstUnfilledSetupStep(student.data) ?? 'SetupDone');
    }
  }, [student.data, navigation]);

  const all = useMemo(
    () => (faculties.data ?? []).map((faculty) => ({ id: faculty.id, title: faculty.name ?? 'Без названия' })),
    [faculties.data],
  );
  const needle = search.trim().toLowerCase();
  const items = needle ? all.filter((item) => item.title.toLowerCase().includes(needle)) : all;
  const selectedId = pickedId ?? student.data?.facultyId;
  const selected = all.find((item) => item.id === selectedId) ?? null;

  const onSubmit = async () => {
    if (!selected) return;
    if (await save({ facultyId: selected.id })) navigation.navigate('SetupYear');
  };

  return (
    <ChoiceStep
      step={4}
      title="Выберите факультет"
      subtitle={university.data?.name ?? 'Факультеты вашего университета'}
      search={
        all.length > SEARCH_THRESHOLD
          ? { value: search, onChangeText: setSearch, placeholder: 'Название факультета' }
          : undefined
      }
      isPending={student.isPending || faculties.isPending}
      loadError={student.error ?? faculties.error}
      onRetry={() => {
        if (student.isError) student.refetch();
        if (faculties.isError) faculties.refetch();
      }}
      items={items}
      empty={
        all.length === 0 ? (
          <>
            <EmptyState
              title="В этом университете пока нет факультетов"
              description="Добавьте свой факультет — его сразу увидят другие студенты университета."
            />
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('SetupNewFaculty')}
              textColor={libraryColors.terracottaButton}
            >
              Создать факультет
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
      skipLabel={all.length === 0 ? 'Завершить без факультета' : 'Моего факультета нет в списке'}
      onSkip={() =>
        all.length === 0
          ? navigation.navigate('SetupDone')
          : navigation.navigate('SetupNewFaculty', { name: search.trim() || undefined })
      }
    />
  );
}
