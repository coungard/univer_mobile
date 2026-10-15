import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, SegmentedButtons, Text } from 'react-native-paper';
import { version } from '../../../package.json';
import { useAuth } from '../../auth/useAuth';
import { libraryFonts } from '../../theme/library';
import { ALL_WEEKDAYS, toggleWeekday, Weekday, WEEKDAY_SHORT_NAMES } from '../schedule/scheduleDays';
import { ScheduleViewMode, ThemePreference, useSettingsStore } from './settingsStore';

/**
 * «Настройки» (issue #60): everything about the app rather than the student, opened from the
 * profile — the schedule's view on opening and its days, the theme, signing out and the
 * app's version. Student only; the teacher gets settings of their own later.
 */
export function SettingsScreen() {
  const { logout } = useAuth();
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const scheduleView = useSettingsStore((state) => state.scheduleView);
  const setScheduleView = useSettingsStore((state) => state.setScheduleView);
  const scheduleDays = useSettingsStore((state) => state.scheduleDays);
  const setScheduleDays = useSettingsStore((state) => state.setScheduleDays);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.section}>
        <Text style={styles.heading}>Расписание</Text>
        <Text variant="bodyMedium" style={styles.label}>
          Что показывать при открытии вкладки
        </Text>
        <SegmentedButtons
          value={scheduleView}
          onValueChange={(value) => setScheduleView(value as ScheduleViewMode)}
          buttons={[
            { value: 'week', label: 'Неделя' },
            { value: 'day', label: 'День' },
          ]}
        />
        <Text variant="bodySmall" style={styles.note}>
          То же переключают корешки дней слева на вкладке «Расписание».
        </Text>

        <Text variant="bodyMedium" style={[styles.label, styles.daysLabel]}>
          Дни недели
        </Text>
        {/* Toggled one at a time, so the last day left on can be kept on (issue #67). */}
        <SegmentedButtons
          multiSelect
          value={scheduleDays.map(String)}
          onValueChange={(values) => {
            const now = values.map(Number) as Weekday[];
            const changed = ALL_WEEKDAYS.find((day) => now.includes(day) !== scheduleDays.includes(day));
            if (changed) setScheduleDays(toggleWeekday(scheduleDays, changed));
          }}
          buttons={ALL_WEEKDAYS.map((day) => ({
            value: String(day),
            label: WEEKDAY_SHORT_NAMES[day - 1],
            showSelectedCheck: false,
            style: styles.dayButton,
            labelStyle: styles.dayButtonLabel,
          }))}
        />
        <Text variant="bodySmall" style={styles.note}>
          Выключенные дни не показываются в расписании — кроме дня, в который всё же есть занятие.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Оформление</Text>
        <Text variant="bodyMedium" style={styles.label}>
          Тема
        </Text>
        <SegmentedButtons
          value={theme}
          onValueChange={(value) => setTheme(value as ThemePreference)}
          buttons={[
            { value: 'system', label: 'Системная' },
            { value: 'light', label: 'Светлая' },
            { value: 'dark', label: 'Тёмная' },
          ]}
        />
        <Text variant="bodySmall" style={styles.note}>
          «Системная» — светлая или тёмная, как в настройках телефона.
        </Text>
      </View>

      <Button mode="outlined" onPress={() => logout()} style={styles.logout}>
        Выйти
      </Button>

      <Text variant="bodySmall" style={styles.version}>
        Univer · версия {version}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 28,
  },
  section: {
    gap: 8,
  },
  heading: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 20,
    lineHeight: 28,
  },
  label: {
    opacity: 0.7,
  },
  note: {
    opacity: 0.6,
  },
  daysLabel: {
    marginTop: 12,
  },
  dayButton: {
    minWidth: 0,
  },
  dayButtonLabel: {
    marginHorizontal: 0,
  },
  logout: {
    marginTop: 8,
  },
  version: {
    opacity: 0.5,
    textAlign: 'center',
  },
});
