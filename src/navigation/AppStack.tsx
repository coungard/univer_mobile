import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { HomePlaceholderScreen } from '../features/home/HomePlaceholderScreen';
import { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomePlaceholderScreen} />
    </Stack.Navigator>
  );
}
