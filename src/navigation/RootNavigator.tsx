import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { restoreSession } from '../auth/sessionManager';
import { useAuthStore } from '../auth/authStore';
import { SplashScreen } from '../features/onboarding/SplashScreen';
import { AppStack } from './AppStack';
import { AuthStack } from './AuthStack';

export function RootNavigator() {
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    restoreSession();
  }, []);

  // While we don't yet know if there's a valid session, there's nothing sensible to navigate to —
  // render the splash screen outside of any navigator rather than picking a stack prematurely.
  if (status === 'restoring') {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {status === 'authenticated' ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
