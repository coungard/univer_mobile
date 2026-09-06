import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { GenerateLectureScreen } from '../features/teacher/GenerateLectureScreen';
import { LectureFormScreen } from '../features/teacher/LectureFormScreen';
import { TeacherLectureDetailsScreen } from '../features/teacher/TeacherLectureDetailsScreen';
import { TeacherTabs } from './TeacherTabs';
import { TeacherStackParamList } from './types';

const Stack = createNativeStackNavigator<TeacherStackParamList>();

/**
 * Wraps `TeacherTabs` in a native stack, same reasoning as `StudentStack` — tapping into a lecture,
 * adding one manually, or generating one from a `Pair` template pushes over the tab bar (ROADMAP.md
 * "Фаза 6").
 */
export function TeacherStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={TeacherTabs} options={{ headerShown: false }} />
      <Stack.Screen name="LectureDetails" component={TeacherLectureDetailsScreen} options={{ title: 'Занятие' }} />
      <Stack.Screen name="LectureForm" component={LectureFormScreen} options={{ title: 'Новое занятие' }} />
      <Stack.Screen name="GenerateLecture" component={GenerateLectureScreen} options={{ title: 'Генерация занятия' }} />
    </Stack.Navigator>
  );
}
