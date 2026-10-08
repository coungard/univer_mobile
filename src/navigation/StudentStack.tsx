import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { CourseDetailsScreen } from '../features/courses/CourseDetailsScreen';
import { StudentSetupDoneScreen } from '../features/onboarding/StudentSetupDoneScreen';
import { StudentSetupFacultyScreen } from '../features/onboarding/StudentSetupFacultyScreen';
import { StudentSetupGroupScreen } from '../features/onboarding/StudentSetupGroupScreen';
import { StudentSetupRegionScreen } from '../features/onboarding/StudentSetupRegionScreen';
import { StudentSetupUniversityScreen } from '../features/onboarding/StudentSetupUniversityScreen';
import { StudentSetupYearScreen } from '../features/onboarding/StudentSetupYearScreen';
import { GroupScheduleScreen } from '../features/schedule/GroupScheduleScreen';
import { LectureDetailsScreen } from '../features/schedule/LectureDetailsScreen';
import { PairFormScreen } from '../features/schedule/PairFormScreen';
import { StudentTabs } from './StudentTabs';
import { StudentStackParamList } from './types';

const Stack = createNativeStackNavigator<StudentStackParamList>();

const setupOptions = { title: 'Настройка профиля' };

/**
 * Wraps `StudentTabs` in a native stack so tapping into a lecture or a course (ROADMAP.md "Фаза 4")
 * pushes a details screen over the tab bar — «переход из ячейки расписания в детали лекции и в
 * карточку курса за 1 тап» — instead of replacing the tabs entirely. Also hosts «Расписание
 * группы»/заполнение занятий (`UI_UX.md`), reachable from `ScheduleScreen`'s empty state, and the
 * profile setup wizard (`Setup*`, PLAN.md), opened from `StudentProfileScreen`.
 */
export function StudentStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={StudentTabs} options={{ headerShown: false }} />
      <Stack.Screen name="LectureDetails" component={LectureDetailsScreen} options={{ title: 'Занятие' }} />
      <Stack.Screen name="CourseDetails" component={CourseDetailsScreen} options={{ title: 'Курс' }} />
      <Stack.Screen name="GroupSchedule" component={GroupScheduleScreen} options={{ title: 'Расписание группы' }} />
      <Stack.Screen name="PairForm" component={PairFormScreen} options={{ title: 'Занятие в расписании' }} />
      <Stack.Screen name="SetupRegion" component={StudentSetupRegionScreen} options={setupOptions} />
      <Stack.Screen name="SetupUniversity" component={StudentSetupUniversityScreen} options={setupOptions} />
      <Stack.Screen name="SetupFaculty" component={StudentSetupFacultyScreen} options={setupOptions} />
      <Stack.Screen name="SetupYear" component={StudentSetupYearScreen} options={setupOptions} />
      <Stack.Screen name="SetupGroup" component={StudentSetupGroupScreen} options={setupOptions} />
      <Stack.Screen name="SetupDone" component={StudentSetupDoneScreen} options={setupOptions} />
    </Stack.Navigator>
  );
}
