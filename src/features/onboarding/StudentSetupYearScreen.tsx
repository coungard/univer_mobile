import React, { useEffect, useState } from 'react';
import { StudentStackScreenProps } from '../../navigation/types';
import { useFacultyQuery, useOwnStudentQuery } from '../profile/hooks';
import { ChoiceStep } from './ChoiceStep';
import { useGroupCountsByYear } from './hooks';
import { firstUnfilledSetupStep, SETUP_YEARS, useSaveSetupStep } from './studentSetup';

/**
 * Step 5 of student registration (PLAN.md): pick a year. Always offered from the fixed 1–5 range,
 * whatever study years the faculty has in the catalog — the year is something the student knows,
 * and it is saved even when no group exists for it yet. Each year carries a hint with the number
 * of groups, so a year with none isn't a surprise on the next step.
 */
export function StudentSetupYearScreen({ navigation }: StudentStackScreenProps<'SetupYear'>) {
  const student = useOwnStudentQuery();
  const facultyId = student.data?.facultyId;
  const faculty = useFacultyQuery(facultyId ?? undefined);
  const groupCounts = useGroupCountsByYear(facultyId, SETUP_YEARS);

  const [pickedYear, setPickedYear] = useState<number | null>(null);
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

  const onSubmit = async () => {
    if (!selected) return;
    if (await save({ yearNumber: Number(selected.id) })) navigation.navigate('SetupGroup');
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
    />
  );
}
