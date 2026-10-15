import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, SegmentedButtons, Text } from 'react-native-paper';
import { version } from '../../../package.json';
import { useAuth } from '../../auth/useAuth';
import { libraryFonts } from '../../theme/library';
import { ScheduleViewMode, ThemePreference, useSettingsStore } from './settingsStore';

/**
 * «Настройки» (issue #60): everything about the app rather than the student, opened from the
 * profile — the schedule's view on opening, the theme, signing out and the
 * app's version. Student only; the teacher gets settings of their own later.
 */
export function SettingsScreen() {
  const { logout } = useAuth();
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const scheduleView = useSettingsStore((state) => state.scheduleView);
  const setScheduleView = useSettingsStore((state) => state.setScheduleView);

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
  logout: {
    marginTop: 8,
  },
  version: {
    opacity: 0.5,
    textAlign: 'center',
  },
});
