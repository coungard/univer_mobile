import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, SegmentedButtons, Text } from 'react-native-paper';
import { version } from '../../../package.json';
import { useAuth } from '../../auth/useAuth';
import { StudentStackParamList } from '../../navigation/types';
import { libraryFonts } from '../../theme/library';
import { GenderSetting } from '../profile/GenderSetting';
import {
  useGroupAcademicPathQuery,
  useOwnStudentQuery,
  useUniversityQuery,
  useUpdateOwnStudentGenderMutation,
} from '../profile/hooks';
import { ALL_WEEKDAYS, toggleWeekday, Weekday, WEEKDAY_SHORT_NAMES } from '../schedule/scheduleDays';
import { ScheduleViewMode, ThemePreference, useSettingsStore } from './settingsStore';

/**
 * «Настройки» (issue #60), opened from the profile: the gender (issue #92), the university and
 * group (issue #90), the schedule's view on opening and its days, the theme, signing out and the
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
      <AboutSection />
      <StudySection />

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
          Выключенные дни не показываются в расписании — кроме дней, в которых всё же есть занятие.
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

/** «О себе» (issue #92): the student's gender, for those who registered before it was asked. */
function AboutSection() {
  const student = useOwnStudentQuery();
  const saveGender = useUpdateOwnStudentGenderMutation();

  if (!student.data) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>О себе</Text>
      <Text variant="bodyMedium" style={styles.label}>
        Пол
      </Text>
      <GenderSetting value={student.data.gender} save={saveGender} />
    </View>
  );
}

/**
 * «Учёба» (issue #90): the student's university and group, and the way to change them — the setup
 * wizard from its first step. The wizard otherwise resumes at the first unfilled step, so this is
 * the only way back to the steps above it, e.g. out of a university that turned out to have no
 * faculties in the catalog. Hidden until a university is picked: till then the profile's «До
 * расписания» card leads into the wizard itself.
 */
function StudySection() {
  const navigation = useNavigation<NativeStackNavigationProp<StudentStackParamList>>();
  const student = useOwnStudentQuery();
  const university = useUniversityQuery(student.data?.universityId ?? undefined);
  const academicPath = useGroupAcademicPathQuery(student.data?.groupId);

  if (!student.data?.universityId) return null;
  const hasGroup = student.data.groupId != null;

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Учёба</Text>
      <Text variant="bodyMedium">{university.data?.name ?? '…'}</Text>
      {hasGroup ? (
        <Text variant="bodyMedium" style={styles.label}>
          Группа {academicPath.group?.name ?? '…'}
        </Text>
      ) : null}
      <Button mode="outlined" onPress={() => navigation.navigate('SetupRegion')} style={styles.studyButton}>
        {hasGroup ? 'Изменить университет или группу' : 'Изменить университет'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  studyButton: {
    marginTop: 4,
  },
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
