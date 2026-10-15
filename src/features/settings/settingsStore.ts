import * as Keychain from 'react-native-keychain';
import { create } from 'zustand';
import { ALL_WEEKDAYS, parseWeekdays, Weekday } from '../schedule/scheduleDays';

/**
 * App settings the student picks on the «Настройки» screen (issue #60), remembered on the device in
 * the same OS storage as the tokens and the hint state (`hints/hintStorage.ts`), one entry each.
 * One store, so the schedule tab and the settings screen always show the same value.
 */

export type ThemePreference = 'system' | 'light' | 'dark';
export type ScheduleViewMode = 'week' | 'day';

// The schedule entry keeps the name it got in issue #59, so a mode chosen before stays chosen.
const THEME_SERVICE = 'univer-mobile.theme';
const SCHEDULE_VIEW_SERVICE = 'univer-mobile.schedule-view';
const SCHEDULE_DAYS_SERVICE = 'univer-mobile.schedule-days';

async function load(service: string): Promise<string | null> {
  try {
    const result = await Keychain.getGenericPassword({ service });
    return result ? result.password : null;
  } catch {
    return null;
  }
}

async function save(service: string, value: string): Promise<void> {
  try {
    await Keychain.setGenericPassword('univer-mobile', value, { service });
  } catch {
    // Losing this only means the default comes back next launch.
  }
}

interface SettingsState {
  /** False until the stored values are read. */
  ready: boolean;
  theme: ThemePreference;
  scheduleView: ScheduleViewMode;
  /** The days of the week the schedule tab shows (issue #67), never empty. */
  scheduleDays: Weekday[];
  setTheme: (theme: ThemePreference) => void;
  setScheduleView: (mode: ScheduleViewMode) => void;
  setScheduleDays: (days: Weekday[]) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  ready: false,
  theme: 'system',
  scheduleView: 'week',
  scheduleDays: [...ALL_WEEKDAYS],
  setTheme: (theme) => {
    set({ theme });
    save(THEME_SERVICE, theme);
  },
  setScheduleView: (scheduleView) => {
    set({ scheduleView });
    save(SCHEDULE_VIEW_SERVICE, scheduleView);
  },
  setScheduleDays: (scheduleDays) => {
    set({ scheduleDays });
    save(SCHEDULE_DAYS_SERVICE, JSON.stringify(scheduleDays));
  },
}));

/** Reads the stored settings once at startup (`App.tsx`). */
export async function loadSettings(): Promise<void> {
  const [theme, scheduleView, scheduleDays] = await Promise.all([
    load(THEME_SERVICE),
    load(SCHEDULE_VIEW_SERVICE),
    load(SCHEDULE_DAYS_SERVICE),
  ]);
  useSettingsStore.setState({
    ready: true,
    theme: theme === 'light' || theme === 'dark' ? theme : 'system',
    scheduleView: scheduleView === 'day' ? 'day' : 'week',
    scheduleDays: parseWeekdays(scheduleDays),
  });
}

/** Whether the app is dark: the student's choice, or the system's under «Как в системе». */
export function isDarkTheme(preference: ThemePreference, systemScheme: string | null | undefined): boolean {
  return preference === 'system' ? systemScheme === 'dark' : preference === 'dark';
}

/**
 * The schedule tab's mode and a setter that also saves it. `ready` is false until the stored value
 * is read, so the tab can wait instead of flashing a week before switching to a day.
 */
export function useScheduleViewMode(): { mode: ScheduleViewMode; setMode: (mode: ScheduleViewMode) => void; ready: boolean } {
  const mode = useSettingsStore((state) => state.scheduleView);
  const setMode = useSettingsStore((state) => state.setScheduleView);
  const ready = useSettingsStore((state) => state.ready);
  return { mode, setMode, ready };
}
