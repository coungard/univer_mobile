import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { ScheduleScreen } from '../features/schedule/ScheduleScreen';
import { StudentProfileScreen } from '../features/profile/StudentProfileScreen';
import { libraryTabBarColors } from '../theme/library';
import { libraryTab, libraryTabBarOptions } from './libraryTabBar';
import { StudentTabParamList } from './types';

const Tab = createBottomTabNavigator<StudentTabParamList>();

/**
 * Core student experience: «Профиль» + «Расписание» (ROADMAP.md "Фаза 3"). There is no «Курсы»
 * tab (issue #56): a course is reached from a lecture in the schedule.
 * The bar's look is shared with `TeacherTabs` — see `libraryTabBar.tsx`.
 */
export function StudentTabs() {
  return (
    <Tab.Navigator screenOptions={libraryTabBarOptions}>
      <Tab.Screen
        name="Profile"
        component={StudentProfileScreen}
        options={libraryTab('Профиль', 'account-outline', libraryTabBarColors.profile)}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={libraryTab('Расписание', 'calendar-blank-outline', libraryTabBarColors.schedule)}
      />
    </Tab.Navigator>
  );
}
