import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { CoursesScreen } from '../features/courses/CoursesScreen';
import { ScheduleScreen } from '../features/schedule/ScheduleScreen';
import { StudentProfileScreen } from '../features/profile/StudentProfileScreen';
import { libraryTabBarColors } from '../theme/library';
import { libraryTab, libraryTabBarOptions } from './libraryTabBar';
import { StudentTabParamList } from './types';

const Tab = createBottomTabNavigator<StudentTabParamList>();

/**
 * Core student experience: «Профиль» + «Расписание» (ROADMAP.md "Фаза 3") + «Курсы" (Фаза 4).
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
      <Tab.Screen
        name="Courses"
        component={CoursesScreen}
        options={libraryTab('Курсы', 'book-open-page-variant-outline', libraryTabBarColors.courses)}
      />
    </Tab.Navigator>
  );
}
