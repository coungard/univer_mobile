import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { TeacherCoursesScreen } from '../features/teacher/TeacherCoursesScreen';
import { TeacherLecturesScreen } from '../features/teacher/TeacherLecturesScreen';
import { TeacherProfileScreen } from '../features/profile/TeacherProfileScreen';
import { libraryTabBarColors } from '../theme/library';
import { libraryTab, libraryTabBarOptions } from './libraryTabBar';
import { TeacherTabParamList } from './types';

const Tab = createBottomTabNavigator<TeacherTabParamList>();

/**
 * Core teacher experience: «Профиль» + «Мои курсы» + «Мои лекции» (ROADMAP.md "Фаза 6"). Same
 * bar as `StudentTabs`; «Лекции» take the icon and the colour of the student's «Расписание».
 */
export function TeacherTabs() {
  return (
    <Tab.Navigator screenOptions={libraryTabBarOptions}>
      <Tab.Screen
        name="Profile"
        component={TeacherProfileScreen}
        options={libraryTab('Профиль', 'account-outline', libraryTabBarColors.profile)}
      />
      <Tab.Screen
        name="Courses"
        component={TeacherCoursesScreen}
        options={libraryTab('Курсы', 'book-open-page-variant-outline', libraryTabBarColors.courses)}
      />
      <Tab.Screen
        name="Lectures"
        component={TeacherLecturesScreen}
        options={libraryTab('Лекции', 'calendar-blank-outline', libraryTabBarColors.schedule)}
      />
    </Tab.Navigator>
  );
}
