import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { CourseDetailsScreen } from '../features/courses/CourseDetailsScreen';
import { StudentSetupDoneScreen } from '../features/onboarding/StudentSetupDoneScreen';
import { StudentSetupFacultyScreen } from '../features/onboarding/StudentSetupFacultyScreen';
import { StudentSetupGroupScreen } from '../features/onboarding/StudentSetupGroupScreen';
import { StudentSetupNewFacultyScreen } from '../features/onboarding/StudentSetupNewFacultyScreen';
import { StudentSetupNewGroupScreen } from '../features/onboarding/StudentSetupNewGroupScreen';
import { StudentSetupRegionScreen } from '../features/onboarding/StudentSetupRegionScreen';
import { StudentSetupUniversityRequestScreen } from '../features/onboarding/StudentSetupUniversityRequestScreen';
import { StudentSetupUniversityScreen } from '../features/onboarding/StudentSetupUniversityScreen';
import { StudentSetupYearScreen } from '../features/onboarding/StudentSetupYearScreen';
import { GroupScheduleScreen } from '../features/schedule/GroupScheduleScreen';
import { StudentRenameOwnScreen } from '../features/profile/StudentRenameOwnScreen';
import { LectureDetailsScreen } from '../features/schedule/LectureDetailsScreen';
import { PairFormScreen } from '../features/schedule/PairFormScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { useLibraryHeaderOptions } from './libraryHeader';
import { StudentTabs } from './StudentTabs';
import { StudentStackParamList } from './types';

const Stack = createNativeStackNavigator<StudentStackParamList>();

/**
 * Wraps `StudentTabs` in a native stack so tapping into a lecture or a course (ROADMAP.md "Фаза 4")
 * pushes a details screen over the tab bar — «переход из ячейки расписания в детали лекции и в
 * карточку курса за 1 тап» — instead of replacing the tabs entirely. Also hosts «Расписание
 * группы»/заполнение занятий (`UI_UX.md`), reachable from `ScheduleScreen`'s empty state, and the
 * profile setup wizard (`Setup*`, PLAN_FINISHED_01.MD) and «Настройки» (issue #60), both opened
 * from `StudentProfileScreen`.
 */
export function StudentStack() {
  // The wizard and «Изменить название» are Library screens (issue #62).
  const libraryHeader = useLibraryHeaderOptions();
  const setupOptions = { title: 'Настройка профиля', ...libraryHeader };
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={StudentTabs} options={{ headerShown: false }} />
      <Stack.Screen name="LectureDetails" component={LectureDetailsScreen} options={{ title: 'Занятие' }} />
      <Stack.Screen name="CourseDetails" component={CourseDetailsScreen} options={{ title: 'Курс' }} />
      <Stack.Screen name="GroupSchedule" component={GroupScheduleScreen} options={{ title: 'Расписание группы' }} />
      <Stack.Screen name="PairForm" component={PairFormScreen} options={{ title: 'Занятие в расписании' }} />
      <Stack.Screen name="SetupRegion" component={StudentSetupRegionScreen} options={setupOptions} />
      <Stack.Screen name="SetupUniversity" component={StudentSetupUniversityScreen} options={setupOptions} />
      <Stack.Screen
        name="SetupUniversityRequest"
        component={StudentSetupUniversityRequestScreen}
        options={setupOptions}
      />
      <Stack.Screen name="SetupFaculty" component={StudentSetupFacultyScreen} options={setupOptions} />
      <Stack.Screen name="SetupYear" component={StudentSetupYearScreen} options={setupOptions} />
      <Stack.Screen name="SetupGroup" component={StudentSetupGroupScreen} options={setupOptions} />
      <Stack.Screen name="SetupNewFaculty" component={StudentSetupNewFacultyScreen} options={setupOptions} />
      <Stack.Screen name="SetupNewGroup" component={StudentSetupNewGroupScreen} options={setupOptions} />
      <Stack.Screen name="RenameOwn" component={StudentRenameOwnScreen} options={{ title: 'Изменить название', ...libraryHeader }} />
      <Stack.Screen name="SetupDone" component={StudentSetupDoneScreen} options={setupOptions} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Настройки' }} />
    </Stack.Navigator>
  );
}
