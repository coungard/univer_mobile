import { useCallback, useEffect, useState } from 'react';
import * as Keychain from 'react-native-keychain';

/**
 * Whether the schedule tab shows a week or a single day (issue #59) — remembered on the device, in
 * the same OS storage as the tokens and the hint state (`hints/hintStorage.ts`), under its own entry.
 */

const SERVICE = 'univer-mobile.schedule-view';

export type ScheduleViewMode = 'week' | 'day';

async function loadMode(): Promise<ScheduleViewMode> {
  try {
    const result = await Keychain.getGenericPassword({ service: SERVICE });
    return result && result.password === 'day' ? 'day' : 'week';
  } catch {
    return 'week';
  }
}

async function saveMode(mode: ScheduleViewMode): Promise<void> {
  try {
    await Keychain.setGenericPassword('univer-mobile', mode, { service: SERVICE });
  } catch {
    // Losing this only means the tab opens as a week next time.
  }
}

/**
 * The remembered mode and a setter that also saves it. `ready` is false until the stored value is
 * read, so the tab can wait instead of flashing a week before switching to a day.
 */
export function useScheduleViewMode(): { mode: ScheduleViewMode; setMode: (mode: ScheduleViewMode) => void; ready: boolean } {
  const [mode, setModeState] = useState<ScheduleViewMode>('week');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadMode().then((stored) => {
      if (cancelled) return;
      setModeState(stored);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback((next: ScheduleViewMode) => {
    setModeState(next);
    saveMode(next);
  }, []);

  return { mode, setMode, ready };
}
