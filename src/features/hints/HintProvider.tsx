import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { EMPTY_HINTS, loadHints, saveHints, StoredHints } from './hintStorage';

interface HintsContextValue {
  /** False until the stored state is read — hints stay hidden meanwhile, so a closed one never flashes. */
  ready: boolean;
  isDismissed: (id: string) => boolean;
  /** Close one hint for good. */
  dismiss: (id: string) => void;
}

const HintsContext = createContext<HintsContextValue | null>(null);

/** Holds what the device remembers about the newcomer hints (PLAN.md, section 3.3). */
export function HintProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [hints, setHints] = useState<StoredHints>(EMPTY_HINTS);

  useEffect(() => {
    let cancelled = false;
    loadHints().then(stored => {
      if (cancelled) return;
      setHints(stored);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback((change: (current: StoredHints) => StoredHints) => {
    setHints(current => {
      const next = change(current);
      saveHints(next);
      return next;
    });
  }, []);

  const value = useMemo<HintsContextValue>(
    () => ({
      ready,
      isDismissed: id => hints.dismissed.includes(id),
      dismiss: id =>
        update(current =>
          current.dismissed.includes(id) ? current : { ...current, dismissed: [...current.dismissed, id] },
        ),
    }),
    [ready, hints, update],
  );

  return <HintsContext.Provider value={value}>{children}</HintsContext.Provider>;
}

export function useHints(): HintsContextValue {
  const value = useContext(HintsContext);
  if (!value) throw new Error('useHints must be used inside HintProvider');
  return value;
}
