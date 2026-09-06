import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { adaptNavigationTheme, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

/**
 * Light/dark Material 3 themes (ROADMAP.md "Фаза 8" — тёмная тема). `App.tsx` picks between these
 * based on `useColorScheme()` and passes the result to `PaperProvider`, so every themed
 * `react-native-paper` component (`Card`, `Button`, `Banner`, ...) already adapts automatically —
 * there's no per-screen dark-mode styling to maintain beyond the handful of places that hardcode a
 * raw color instead of reading it from `useTheme()` (grep the codebase for `#` literals in
 * `StyleSheet.create` before adding a new one).
 */
export const paperLightTheme = MD3LightTheme;
export const paperDarkTheme = MD3DarkTheme;

/**
 * React Navigation's own theme (screen background behind Paper content, header/tab bar chrome)
 * defaults to a fixed light palette regardless of system setting — without this, dark mode would
 * still show a white `NavigationContainer` background around/behind dark Paper components.
 * `adaptNavigationTheme` merges each Paper palette's colors into the matching navigation theme so
 * both stay in sync; `RootNavigator` picks between the two results the same way `App.tsx` picks
 * between `paperLightTheme`/`paperDarkTheme`.
 */
const { LightTheme: navigationLightTheme, DarkTheme: navigationDarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
  materialLight: paperLightTheme,
  materialDark: paperDarkTheme,
});

export { navigationDarkTheme, navigationLightTheme };
