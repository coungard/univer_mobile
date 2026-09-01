import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { ScheduleScreen } from '../features/schedule/ScheduleScreen';
import { StudentProfileScreen } from '../features/profile/StudentProfileScreen';

const Tab = createBottomTabNavigator();

/**
 * Core student experience (ROADMAP.md "Фаза 3"): «Профиль» + «Расписание». No icons — the project
 * doesn't link a vector-icon font yet (see ANDROID_TROUBLESHOOTING.md for how much native-build
 * pain this repo has already been through; text-only tab labels sidestep that entirely).
 */
export function StudentTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Profile" component={StudentProfileScreen} options={{ title: 'Профиль' }} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ title: 'Расписание' }} />
    </Tab.Navigator>
  );
}
