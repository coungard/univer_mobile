import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { TeacherCoursesScreen } from '../features/teacher/TeacherCoursesScreen';
import { TeacherLecturesScreen } from '../features/teacher/TeacherLecturesScreen';
import { TeacherProfileScreen } from '../features/profile/TeacherProfileScreen';
import { TeacherTabParamList } from './types';

const Tab = createBottomTabNavigator<TeacherTabParamList>();

/**
 * Core teacher experience: «Профиль» + «Мои курсы» + «Мои лекции» (ROADMAP.md "Фаза 6"). Same
 * text-only tab labels as `StudentTabs` — no vector-icon font linked in this project yet.
 */
export function TeacherTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Profile" component={TeacherProfileScreen} options={{ title: 'Профиль' }} />
      <Tab.Screen name="Courses" component={TeacherCoursesScreen} options={{ title: 'Курсы' }} />
      <Tab.Screen name="Lectures" component={TeacherLecturesScreen} options={{ title: 'Лекции' }} />
    </Tab.Navigator>
  );
}
