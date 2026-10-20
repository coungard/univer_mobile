import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Snackbar, Text } from 'react-native-paper';
import { describeError, NetworkError } from '../../api/errors';
import { libraryFonts, useLibraryColors } from '../../theme/library';
import { MarkVariables, useMarkMyAttendanceMutation, useMyAttendanceQuery } from './hooks';
import { LectureMark, lectureMarkOf, markAccessibilityLabel, nextMark } from './selfMark';

/** `week` — a row of the week, `day` — the open day, `history` — the course card's history. */
type PlaqueSize = 'week' | 'day' | 'history';

interface Props {
  time: string;
  mark: LectureMark;
  /** The lecture has started. Before that the time is plain text, as it always was. */
  markable: boolean;
  size?: PlaqueSize;
  onPress: () => void;
}

/**
 * The lecture's time as the attendance button (issue #71, variant 5 «Цвет времени» on the canvas
 * https://claude.ai/artifact/TvgbsoHXb1FMLJ6LpN9iDC): dashed with no mark, a sage fill for «был»,
 * a rust fill and a strikethrough for «не был». A teacher's mark is shown the same way but can't be tapped.
 */
export function AttendanceTime({ time, mark, markable, size = 'week', onPress }: Props) {
  const c = useLibraryColors();
  const box = boxes[size];

  if (!markable) {
    return (
      <View style={[box, styles.center]}>
        <Text style={[styles.time, textSizes[size], { color: c.inkMuted }]}>{time}</Text>
      </View>
    );
  }

  const look =
    mark.mark === 'attended'
      ? { box: { backgroundColor: c.attendedTint }, text: [styles.marked, { color: c.sage }] }
      : mark.mark === 'missed'
        ? { box: { backgroundColor: c.missedTint }, text: [styles.marked, styles.missed, { color: c.rust }] }
        : { box: [styles.unmarked, { borderColor: c.inkFaint }], text: { color: c.inkMuted } };
  const label = markAccessibilityLabel(time, mark);
  const content = <Text style={[styles.time, textSizes[size], look.text]}>{time}</Text>;

  if (mark.byTeacher) {
    return (
      <View accessible accessibilityLabel={label} style={[box, styles.center, look.box]}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={hitSlops[size]}
      style={[box, styles.center, look.box]}
    >
      {content}
    </Pressable>
  );
}

/**
 * The student's marks for a screen with time plaques: `markOf` for each lecture, `toggle` for a tap,
 * and the `snackbar` to render last in the screen's root view. A failed tap rolls the plaque back;
 * without a network the Snackbar offers «Повторить» with the same mark, a refusal shows the
 * server's reason (issue #71, decided 2026-10-20).
 */
export function useSelfMark() {
  const marks = useMyAttendanceQuery();
  const [failure, setFailure] = useState<{ variables: MarkVariables; message: string; retry: boolean } | null>(
    null,
  );
  const mutation = useMarkMyAttendanceMutation((error, variables) =>
    setFailure(
      error instanceof NetworkError
        ? { variables, message: 'Нет сети — отметка не сохранена', retry: true }
        : { variables, message: describeError(error).message, retry: false },
    ),
  );
  const { mutate } = mutation;

  const byLecture = useMemo(() => new Map((marks.data ?? []).map((dto) => [dto.lectureId, dto])), [marks.data]);
  const markOf = useCallback((lectureId: string) => lectureMarkOf(byLecture.get(lectureId)), [byLecture]);

  const send = useCallback(
    (variables: MarkVariables) => {
      setFailure(null);
      mutate(variables);
    },
    [mutate],
  );
  const toggle = useCallback(
    (lectureId: string) => {
      const current = markOf(lectureId);
      if (!current.byTeacher) send({ lectureId, mark: nextMark(current.mark) });
    },
    [markOf, send],
  );

  const snackbar = (
    <Snackbar
      visible={failure !== null}
      onDismiss={() => setFailure(null)}
      duration={4000}
      action={failure?.retry ? { label: 'Повторить', onPress: () => send(failure.variables) } : undefined}
    >
      {failure?.message ?? ''}
    </Snackbar>
  );

  return { markOf, toggle, snackbar };
}

const boxes = StyleSheet.create({
  week: { width: 52, height: 32, borderRadius: 8 },
  day: { width: 60, height: 44, borderRadius: 10 },
  history: { width: 52, height: 28, borderRadius: 8 },
});

const textSizes = StyleSheet.create({
  week: { fontSize: 14 },
  day: { fontSize: 15 },
  history: { fontSize: 13 },
});

// Up to 44 points to tap.
const hitSlops = { week: { top: 6, bottom: 6 }, day: undefined, history: { top: 8, bottom: 8 } };

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  unmarked: {
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  time: {
    fontFamily: libraryFonts.bodyRegular,
  },
  marked: {
    fontFamily: libraryFonts.bodyBold,
  },
  missed: {
    textDecorationLine: 'line-through',
  },
});
