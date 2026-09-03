import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { CourseDetailsScreen } from '../features/courses/CourseDetailsScreen';
import { GroupScheduleScreen } from '../features/schedule/GroupScheduleScreen';
import { LectureDetailsScreen } from '../features/schedule/LectureDetailsScreen';
import { PairFormScreen } from '../features/schedule/PairFormScreen';
import { StudentTabs } from './StudentTabs';
import { StudentStackParamList } from './types';

const Stack = createNativeStackNavigator<StudentStackParamList>();

/**
 * Wraps `StudentTabs` in a native stack so tapping into a lecture or a course (ROADMAP.md "Фаза 4")
 * pushes a details screen over the tab bar — «переход из ячейки расписания в детали лекции и в
 * карточку курса за 1 тап» — instead of replacing the tabs entirely. Also hosts «Расписание
 * группы»/заполнение занятий (`UI_UX.md`), reachable from `ScheduleScreen`'s empty state.
 */
export function StudentStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={StudentTabs} options={{ headerShown: false }} />
      <Stack.Screen name="LectureDetails" component={LectureDetailsScreen} options={{ title: 'Занятие' }} />
      <Stack.Screen name="CourseDetails" component={CourseDetailsScreen} options={{ title: 'Курс' }} />
      <Stack.Screen name="GroupSchedule" component={GroupScheduleScreen} options={{ title: 'Расписание группы' }} />
      <Stack.Screen name="PairForm" component={PairFormScreen} options={{ title: 'Занятие в расписании' }} />
    </Stack.Navigator>
  );
}
