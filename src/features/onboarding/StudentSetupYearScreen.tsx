import React, { useEffect, useState } from 'react';
import { StudentStackScreenProps } from '../../navigation/types';
import { useNewcomer } from '../hints/useNewcomer';
import { useFacultyQuery, useOwnStudentQuery } from '../profile/hooks';
import { ChoiceStep } from './ChoiceStep';
import { useGroupCountsByYear } from './hooks';
import { firstUnfilledSetupStep, SETUP_YEARS, useConfirmGroupReset, useSaveSetupStep } from './studentSetup';

/**
 * Step 5 of student registration (PLAN_FINISHED_01.MD): pick a year. Always offered from the fixed 1–6 range,
 * whatever study years the faculty has in the catalog — the year is something the student knows,
 * and it is saved even when no group exists for it yet. Each year carries a hint with the number
 * of groups; a year with none leads straight to the form of a new group, past the empty step 6.
 */
export function StudentSetupYearScreen({ navigation }: StudentStackScreenProps<'SetupYear'>) {
  const student = useOwnStudentQuery();
  const facultyId = student.data?.facultyId;
  const faculty = useFacultyQuery(facultyId ?? undefined);
  const groupCounts = useGroupCountsByYear(facultyId, SETUP_YEARS);

  const [pickedYear, setPickedYear] = useState<number | null>(null);
  const newcomer = useNewcomer();
  const { save, saving, error, clearError } = useSaveSetupStep(() => setPickedYear(null));

  // This step needs a faculty — without one the wizard resumes further up the chain.
  useEffect(() => {
    if (student.data && !student.data.facultyId) {
      navigation.replace(firstUnfilledSetupStep(student.data) ?? 'SetupDone');
    }
  }, [student.data, navigation]);

  const items = SETUP_YEARS.map((year, index) => {
    const count = groupCounts[index];
    return {
      id: String(year),
      title: `${year} курс`,
      subtitle: count === undefined ? undefined : count > 0 ? `Групп: ${count}` : 'Групп пока нет',
    };
  });
  const selectedYear = pickedYear ?? student.data?.yearNumber;
  const selected = items.find((item) => item.id === String(selectedYear)) ?? null;

  const confirmReset = useConfirmGroupReset();
  const onSubmit = () => {
    if (!selected) return;
    confirmReset('year', Number(selected.id) !== student.data?.yearNumber, submit);
  };

  const submit = async () => {
    if (!selected) return;
    const year = Number(selected.id);
    if (!(await save({ yearNumber: year }))) return;
    // A count that hasn't loaded is not "no groups": step 6 handles an empty list by itself.
    const noGroups = groupCounts[SETUP_YEARS.findIndex((y) => y === year)] === 0;
    navigation.navigate(noGroups ? 'SetupNewGroup' : 'SetupGroup');
  };

  return (
    <ChoiceStep
      step={5}
      title="Выберите курс"
      subtitle={faculty.data?.name ?? 'На каком курсе вы учитесь'}
      isPending={student.isPending}
      loadError={student.error}
      onRetry={() => student.refetch()}
      items={items}
      empty={null}
      selected={selected}
      onSelect={(item) => setPickedYear(Number(item.id))}
      onSubmit={onSubmit}
      submitting={saving}
      submitError={error}
      onDismissSubmitError={clearError}
      skipLabel="Выберу позже"
      onSkip={() => navigation.navigate('SetupDone')}
      hint={{
        id: 'setup-year',
        stage: 1,
        text: 'Выберите свой курс. Если групп на нём пока нет — создадите свою на следующем шаге.',
        active: newcomer.kind === 'newcomer',
        target: 'submit',
      }}
    />
  );
}
