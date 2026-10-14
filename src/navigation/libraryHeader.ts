import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { useTheme } from 'react-native-paper';
import { useLibraryColors } from '../theme/library';

/**
 * Header of the Library screens (registration, the setup wizard, «Изменить название») in the dark
 * theme (issue #62): the navigator's own dark header and background are a cold grey, so next to
 * «Переплёт» they read as a different app. The light theme keeps the navigator's defaults.
 */
export function useLibraryHeaderOptions(): NativeStackNavigationOptions {
  const dark = useTheme().dark;
  const c = useLibraryColors();
  return useMemo(
    () =>
      dark
        ? {
            headerStyle: { backgroundColor: c.header },
            headerTintColor: c.ink,
            // Also behind the screen while it slides in, so no grey shows during the transition.
            contentStyle: { backgroundColor: c.background },
          }
        : {},
    [dark, c],
  );
}
