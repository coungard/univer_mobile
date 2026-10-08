import { create } from 'zustand';
import { FieldErrors } from '../../api/errors';
import { StudentRegistrationForm } from './schemas';

interface RegistrationDraftState {
  /** Validated values of step 1, held until the university step submits the whole request. */
  personal: StudentRegistrationForm | null;
  /** Backend validation errors for the fields of step 1, discovered only when a later step submits. */
  serverFieldErrors: FieldErrors | null;

  setPersonal: (personal: StudentRegistrationForm) => void;
  setServerFieldErrors: (errors: FieldErrors | null) => void;
  reset: () => void;
}

/**
 * In-memory draft of the multi-step student registration (PLAN.md). Deliberately a store rather
 * than navigation params: the draft carries the password, and route params can end up in
 * persisted/logged navigation state. `RegisterStudentScreen` resets it when the wizard is left.
 */
export const useRegistrationDraftStore = create<RegistrationDraftState>((set) => ({
  personal: null,
  serverFieldErrors: null,

  setPersonal: (personal) => set({ personal }),
  setServerFieldErrors: (serverFieldErrors) => set({ serverFieldErrors }),
  reset: () => set({ personal: null, serverFieldErrors: null }),
}));
