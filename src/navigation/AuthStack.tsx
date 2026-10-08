import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { LoginScreen } from '../features/onboarding/LoginScreen';
import { RegisterRoleChoiceScreen } from '../features/onboarding/RegisterRoleChoiceScreen';
import { RegisterStudentScreen } from '../features/onboarding/RegisterStudentScreen';
import { RegisterTeacherScreen } from '../features/onboarding/RegisterTeacherScreen';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="RegisterRoleChoice"
        component={RegisterRoleChoiceScreen}
        options={{ headerShown: true, title: 'Регистрация' }}
      />
      <Stack.Screen
        name="RegisterStudent"
        component={RegisterStudentScreen}
        options={{ headerShown: true, title: 'Регистрация студента' }}
      />
      <Stack.Screen
        name="RegisterTeacher"
        component={RegisterTeacherScreen}
        options={{ headerShown: true, title: 'Регистрация преподавателя' }}
      />
    </Stack.Navigator>
  );
}
