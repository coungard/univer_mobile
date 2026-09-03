import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { CoursesScreen } from '../features/courses/CoursesScreen';
import { ScheduleScreen } from '../features/schedule/ScheduleScreen';
import { StudentProfileScreen } from '../features/profile/StudentProfileScreen';
import { StudentTabParamList } from './types';

const Tab = createBottomTabNavigator<StudentTabParamList>();

/**
 * Core student experience: «Профиль» + «Расписание» (ROADMAP.md "Фаза 3") + «Курсы" (Фаза 4). No
 * icons — the project doesn't link a vector-icon font yet (see ANDROID_TROUBLESHOOTING.md for how
 * much native-build pain this repo has already been through; text-only tab labels sidestep that
 * entirely).
 */
export function StudentTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Profile" component={StudentProfileScreen} options={{ title: 'Профиль' }} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ title: 'Расписание' }} />
      <Tab.Screen name="Courses" component={CoursesScreen} options={{ title: 'Курсы' }} />
    </Tab.Navigator>
  );
}
