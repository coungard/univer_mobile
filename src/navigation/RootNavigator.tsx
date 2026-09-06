import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { useTheme } from 'react-native-paper';
import { restoreSession } from '../auth/sessionManager';
import { useAuthStore } from '../auth/authStore';
import { SplashScreen } from '../features/onboarding/SplashScreen';
import { navigationDarkTheme, navigationLightTheme } from '../theme/paperTheme';
import { AppStack } from './AppStack';
import { AuthStack } from './AuthStack';

export function RootNavigator() {
  const status = useAuthStore((state) => state.status);
  // Follows whichever Paper theme `App.tsx` picked (light/dark), rather than re-deriving it from
  // `useColorScheme()` independently — one source of truth for "are we in dark mode" (ROADMAP.md
  // "Фаза 8"). Without this, `NavigationContainer`'s own default light palette would leave screen
  // backgrounds/header chrome white in dark mode even though Paper's own components turned dark.
  const paperTheme = useTheme();

  useEffect(() => {
    restoreSession();
  }, []);

  // While we don't yet know if there's a valid session, there's nothing sensible to navigate to —
  // render the splash screen outside of any navigator rather than picking a stack prematurely.
  if (status === 'restoring') {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={paperTheme.dark ? navigationDarkTheme : navigationLightTheme}>
      {status === 'authenticated' ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
