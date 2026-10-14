import React, { useEffect, useMemo, useState } from 'react';
import { Button } from 'react-native-paper';
import { EmptyState } from '../../components/EmptyState';
import { StudentStackScreenProps } from '../../navigation/types';
import { useLibraryColors } from '../../theme/library';
import { Hint } from '../hints/Hint';
import { useNewcomer } from '../hints/useNewcomer';
import { useFacultyQuery, useOwnStudentQuery } from '../profile/hooks';
import { ChoiceStep } from './ChoiceStep';
import { useGroupsQuery } from './hooks';
import { firstUnfilledSetupStep, useSaveSetupStep } from './studentSetup';

const HINT = {
  id: 'setup-group',
  stage: 1,
  text: 'Нет вашей группы? Создайте её — одногруппники потом найдут её в списке.',
};

/** Below this many groups a search field is just clutter. */
const SEARCH_THRESHOLD = 8;

/**
 * Step 6 of student registration (PLAN_FINISHED_01.MD): pick a group of the saved faculty on the saved year.
 * The student joins it right away, no administrator involved. A group that isn't there — the
 * list is empty or just doesn't have it — is created by the student on `SetupNewGroup`.
 */
export function StudentSetupGroupScreen({ navigation }: StudentStackScreenProps<'SetupGroup'>) {
  const c = useLibraryColors();
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
  const isNewcomer = useNewcomer().kind === 'newcomer';

  // This step needs a faculty and a year — without them the wizard resumes further up the chain.
  useEffect(() => {
    if (student.data && (!student.data.facultyId || student.data.yearNumber == null)) {
      navigation.replace(firstUnfilledSetupStep(student.data) ?? 'SetupDone');
    }
  }, [student.data, navigation]);

  // The full name as a second line tells apart groups with similar short names («У530 РПиС» and
  // «У533 РПиС», issue #54); search looks in both.
  const all = useMemo(
    () =>
      (groups.data ?? []).map((group) => {
        const fullName = group.fullName?.trim();
        return { id: group.id, title: group.name, subtitle: fullName && fullName !== group.name ? fullName : undefined };
      }),
    [groups.data],
  );
  const needle = search.trim().toLowerCase();
  const items = needle
    ? all.filter((item) => item.title.toLowerCase().includes(needle) || item.subtitle?.toLowerCase().includes(needle))
    : all;
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
            <Hint {...HINT} active={isNewcomer}>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('SetupNewGroup')}
                textColor={c.terracottaButton}
              >
                Создать группу
              </Button>
            </Hint>
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
      skipLabel={all.length === 0 ? 'Завершить без группы' : 'Создать свою группу'}
      // With an empty list the hint sits on the «Создать группу» button above instead.
      hint={
        all.length === 0
          ? undefined
          : {
              ...HINT,
              text: 'Нет вашей группы? Нажмите «Создать свою группу» внизу — одногруппники потом найдут её в списке.',
              active: isNewcomer,
              target: 'skip',
            }
      }
      onSkip={() =>
        all.length === 0
          ? navigation.navigate('SetupDone')
          : navigation.navigate('SetupNewGroup', { name: search.trim() || undefined })
      }
    />
  );
}
