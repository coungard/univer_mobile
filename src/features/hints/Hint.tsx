import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Icon, Portal, useTheme } from 'react-native-paper';
import { libraryDarkColors, libraryFonts, libraryHintColors } from '../../theme/library';
import { useHints } from './HintProvider';

/** The newcomer's path to the first pair; every hint shows where on it the student is. */
export const HINT_STAGES = ['Факультет', 'Группа', 'Первая пара'] as const;

interface HintProps {
  /** Stable id — a closed hint is remembered by it. */
  id: string;
  /** 0-based index into `HINT_STAGES`. */
  stage: number;
  text: string;
  /** Whether this is the hint to show now (PLAN.md, section 3.3 — decided from server data). */
  active?: boolean;
  /**
   * Extra distance between the target and the bubble, for a target with something right next to it
   * that the bubble must not cover (a link under the primary button). The arrow is dropped then —
   * it would point at that neighbour; the frame and the text name the target instead.
   */
  clearance?: number;
  /** Style of the wrapper around the target, e.g. `alignSelf` to keep the target's own layout. */
  style?: StyleProp<ViewStyle>;
  /** The element the hint points at. */
  children: React.ReactNode;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const SIDE_MARGIN = 20;
const GAP = 16;
const ARROW = 14;
/** Room the bubble needs under the target; with less it goes above. */
const BUBBLE_ROOM = 190;
const REMEASURE_MS = 300;

function sameRect(a: Rect | null, b: Rect): boolean {
  return (
    !!a &&
    Math.abs(a.x - b.x) < 1 &&
    Math.abs(a.y - b.y) < 1 &&
    Math.abs(a.width - b.width) < 1 &&
    Math.abs(a.height - b.height) < 1
  );
}

/**
 * A hint of the newcomer mode in the «Ярлык» look (PLAN.md M20/M21, canvas
 * https://claude.ai/artifact/4zHVkA1JMf7RdqU5sWHFvX): a gold frame around the target and a dark
 * bubble with an arrow next to it. The bubble sits in a `Portal`, not inside the target's parent —
 * Android doesn't deliver touches to a child drawn outside its parent's bounds, so its buttons
 * wouldn't work there. It doesn't block the screen: everything around stays tappable.
 */
export function Hint({ id, stage, text, active = true, clearance = 0, style, children }: HintProps) {
  const hints = useHints();
  const focused = useIsFocused();
  // On the dark screen the ink bubble would vanish (issue #60).
  const raised = useTheme().dark ? { backgroundColor: libraryDarkColors.raisedInk } : null;
  const shown = active && focused && hints.ready && !hints.isDismissed(id);

  const targetRef = useRef<View>(null);
  const hostRef = useRef<View>(null);
  const [target, setTarget] = useState<Rect | null>(null);
  const [host, setHost] = useState<Rect | null>(null);

  // The target can move without a layout pass of its own (a list scrolls, the keyboard opens), so
  // the position is re-read on a timer while the hint is up.
  const measure = useCallback(() => {
    targetRef.current?.measureInWindow((x, y, width, height) => {
      const next = { x, y, width, height };
      setTarget(current => (sameRect(current, next) ? current : next));
    });
    hostRef.current?.measureInWindow((x, y, width, height) => {
      const next = { x, y, width, height };
      setHost(current => (sameRect(current, next) ? current : next));
    });
  }, []);

  useEffect(() => {
    if (!shown) return;
    measure();
    const timer = setInterval(measure, REMEASURE_MS);
    return () => clearInterval(timer);
  }, [shown, measure]);

  const placed = shown && target && host && target.width > 0 && host.height > 0;
  // Both rects are window coordinates; the bubble is laid out inside the portal host.
  const top = placed ? target.y - host.y : 0;
  const left = placed ? target.x - host.x : 0;
  const below = placed ? host.height - (top + target.height) >= BUBBLE_ROOM : true;
  const arrowLeft = placed
    ? Math.min(Math.max(left + target.width / 2 - SIDE_MARGIN - ARROW / 2, 18), host.width - 2 * SIDE_MARGIN - 32)
    : 0;

  return (
    <View ref={targetRef} collapsable={false} onLayout={measure} style={style}>
      {children}
      {shown ? <View pointerEvents="none" style={styles.frame} /> : null}
      {shown ? (
        <Portal>
          <View ref={hostRef} collapsable={false} onLayout={measure} pointerEvents="box-none" style={styles.host}>
            {placed ? (
              <View
                accessibilityRole="alert"
                style={[
                  styles.bubble,
                  raised,
                  below
                    ? { top: top + target.height + GAP + clearance }
                    : { bottom: host.height - top + GAP + clearance },
                ]}
              >
                {clearance === 0 ? (
                  <View style={[styles.arrow, raised, below ? styles.arrowUp : styles.arrowDown, { left: arrowLeft }]} />
                ) : null}
                <View style={styles.headerRow}>
                  <Text style={styles.path}>
                    {HINT_STAGES.map((name, index) => (
                      <Text key={name} style={index === stage ? styles.pathCurrent : undefined}>
                        {index > 0 ? '  →  ' : ''}
                        {name}
                      </Text>
                    ))}
                  </Text>
                  <Pressable
                    onPress={() => hints.dismiss(id)}
                    accessibilityRole="button"
                    accessibilityLabel="Закрыть подсказку"
                    hitSlop={12}
                    style={styles.close}
                  >
                    <Icon source="close" size={18} color={libraryHintColors.muted} />
                  </Pressable>
                </View>
                <Text style={styles.text}>{text}</Text>
                <View style={styles.actions}>
                  <Pressable onPress={() => hints.dismiss(id)} accessibilityRole="button" style={styles.okButton}>
                    <Text style={styles.okLabel}>Понятно</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        </Portal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'absolute',
    top: -6,
    right: -6,
    bottom: -6,
    left: -6,
    borderWidth: 3,
    borderRadius: 16,
    borderColor: libraryHintColors.frame,
  },
  host: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  bubble: {
    position: 'absolute',
    left: SIDE_MARGIN,
    right: SIDE_MARGIN,
    gap: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: libraryHintColors.background,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  arrow: {
    position: 'absolute',
    width: ARROW,
    height: ARROW,
    backgroundColor: libraryHintColors.background,
    transform: [{ rotate: '45deg' }],
  },
  arrowUp: {
    top: -ARROW / 2,
  },
  arrowDown: {
    bottom: -ARROW / 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  path: {
    flex: 1,
    fontFamily: libraryFonts.bodyBold,
    fontSize: 10.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: libraryHintColors.muted,
  },
  pathCurrent: {
    color: libraryHintColors.accent,
  },
  close: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 15,
    lineHeight: 21,
    color: libraryHintColors.text,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  okButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 10,
    justifyContent: 'center',
    backgroundColor: libraryHintColors.accent,
  },
  okLabel: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 14,
    color: libraryHintColors.background,
  },
});
