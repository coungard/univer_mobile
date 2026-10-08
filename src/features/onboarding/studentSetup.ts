import { useState } from 'react';
import { create } from 'zustand';
import { ApiError } from '../../api/errors';
import { StudentDto, UpdateStudentProfileRequest } from '../../api/types';
import { StudentStackParamList } from '../../navigation/types';
import { useUpdateOwnStudentMutation } from './hooks';

/** Years offered on the year step (PLAN.md: «курс 1–5»). */
export const SETUP_YEARS = [1, 2, 3, 4, 5] as const;

export type SetupStepRoute = Extract<
  keyof StudentStackParamList,
  'SetupRegion' | 'SetupFaculty' | 'SetupYear' | 'SetupGroup'
>;

/**
 * Where the setup wizard should resume for this profile — the first link of university → faculty →
 * year → group that isn't filled in yet — or `null` when the profile is complete. The region isn't
 * stored (it is only a filter for the university list), so a missing university resumes there.
 */
export function firstUnfilledSetupStep(student: StudentDto): SetupStepRoute | null {
  if (!student.universityId) return 'SetupRegion';
  if (!student.facultyId) return 'SetupFaculty';
  if (student.yearNumber == null) return 'SetupYear';
  if (!student.groupId) return 'SetupGroup';
  return null;
}

/** What the unfilled step asks for — for the «Завершить настройку» card in the profile. */
export const SETUP_STEP_PROMPTS: Record<SetupStepRoute, string> = {
  SetupRegion: 'Выберите университет',
  SetupFaculty: 'Выберите факультет',
  SetupYear: 'Выберите курс',
  SetupGroup: 'Выберите группу',
};

interface SetupPromptState {
  /** Id of the user the wizard has already been opened for automatically in this app session. */
  promptedFor: string | null;
  markPrompted: (userId: string) => void;
}

/**
 * The wizard opens by itself once per app session for a student with an unfinished profile
 * (PLAN.md, раздел 3). Kept in memory on purpose: skipping the wizard should not bring it back
 * until the next launch, and after that the profile card is the way in.
 */
export const useSetupPromptStore = create<SetupPromptState>((set) => ({
  promptedFor: null,
  markPrompted: (promptedFor) => set({ promptedFor }),
}));

/**
 * Saves one step of the wizard with `PATCH /students/me` and turns a failure into a message for
 * the step's banner. A `404` means the chosen entity disappeared between loading the list and
 * saving — `onGone` lets the step drop the selection and reload its list.
 */
export function useSaveSetupStep(onGone: () => void) {
  const update = useUpdateOwnStudentMutation();
  const [error, setError] = useState<string | null>(null);

  const save = async (patch: UpdateStudentProfileRequest): Promise<boolean> => {
    setError(null);
    try {
      await update.mutateAsync(patch);
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        onGone();
        setError('Этот вариант больше недоступен. Список обновлён — выберите другой.');
      } else {
        setError(e instanceof Error ? e.message : 'Не удалось сохранить. Попробуйте ещё раз.');
      }
      return false;
    }
  };

  return { save, saving: update.isPending, error, clearError: () => setError(null) };
}
