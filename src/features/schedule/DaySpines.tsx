import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { libraryColors, libraryDarkColors, libraryFonts, librarySpineColors } from '../../theme/library';
import { dayName, formatDayDate, isSameDay, Week } from './dateUtils';

const SHORT_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

interface Props {
  week: Week;
  /** The shown day, or null when the whole week is shown. */
  selected: Date | null;
  today: Date;
  onPickWeek: () => void;
  onPickDay: (day: Date) => void;
}

/**
 * «Корешки дней» (issue #59, variant 6 of the canvas https://claude.ai/artifact/Hpr2ts5Pw67LYNd5NM5WWj):
 * a column of book spines down the left edge — «Вся неделя» and the seven days of the shown week.
 * The chosen spine sticks out further than the rest; today's spine carries a dot under its number.
 */
export function DaySpines({ week, selected, today, onPickWeek, onPickDay }: Props) {
  // The ink spine would vanish against the dark screen (issue #60).
  const weekSpine = useTheme().dark ? { backgroundColor: libraryDarkColors.raisedInk } : styles.weekSpine;
  return (
    <View accessibilityRole="tablist" accessibilityLabel="День недели" style={styles.column}>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: selected === null }}
        accessibilityLabel="Вся неделя"
        onPress={onPickWeek}
        style={[styles.spine, weekSpine, selected === null && styles.spineSelected]}
      >
        <Text style={[styles.weekLabel, { color: libraryColors.cream }]}>{'Вся\nнеделя'}</Text>
      </Pressable>
      {week.days.map((day, i) => {
        const background = librarySpineColors[i % librarySpineColors.length];
        // Light type doesn't read on the gold spine.
        const color = background === libraryColors.gold ? libraryColors.ink : libraryColors.cream;
        const isSelected = selected !== null && isSameDay(day, selected);
        const isToday = isSameDay(day, today);
        return (
          <Pressable
            key={day.getTime()}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${dayName(day)}, ${formatDayDate(day)}${isToday ? ', сегодня' : ''}`}
            onPress={() => onPickDay(day)}
            style={[styles.spine, { backgroundColor: background }, isSelected && styles.spineSelected]}
          >
            <Text style={[styles.short, { color }]}>{SHORT_NAMES[i]}</Text>
            <Text style={[styles.number, { color }]}>{day.getDate()}</Text>
            {isToday ? <View style={[styles.todayDot, { backgroundColor: color }]} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    width: 64,
    gap: 3,
    paddingTop: 8,
    paddingBottom: 12,
  },
  spine: {
    flex: 1,
    width: 48,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  spineSelected: {
    width: 64,
  },
  weekSpine: {
    backgroundColor: libraryColors.ink,
  },
  weekLabel: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 12,
    lineHeight: 15,
    textAlign: 'center',
  },
  short: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 11,
    lineHeight: 14,
  },
  number: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 17,
    lineHeight: 22,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
