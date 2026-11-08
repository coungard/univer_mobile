import { create } from 'zustand';

interface SessionNoticeState {
  /** A one-off line for the login screen about how the last session ended, e.g. «Аккаунт удалён». */
  notice: string | null;
  show: (notice: string) => void;
  dismiss: () => void;
}

/**
 * Survives the switch from the app's stack to the login screen: the screen that ended the session
 * unmounts along with its own state, so the message has to wait here.
 */
export const useSessionNoticeStore = create<SessionNoticeState>((set) => ({
  notice: null,
  show: (notice) => set({ notice }),
  dismiss: () => set({ notice: null }),
}));
