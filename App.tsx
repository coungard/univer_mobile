/**
 * Univer mobile client.
 *
 * @format
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HintProvider } from './src/features/hints/HintProvider';
import { isDarkTheme, loadSettings, useSettingsStore } from './src/features/settings/settingsStore';
import { RootNavigator } from './src/navigation/RootNavigator';
import { paperDarkTheme, paperLightTheme } from './src/theme/paperTheme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function App() {
  // The theme picked in «Настройки» (issue #60), the system's until the stored choice is read.
  const systemScheme = useColorScheme();
  const themePreference = useSettingsStore((state) => state.theme);
  const isDarkMode = isDarkTheme(themePreference, systemScheme);

  useEffect(() => {
    loadSettings();
  }, []);
  const theme = isDarkMode ? paperDarkTheme : paperLightTheme;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={theme}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <HintProvider>
              <RootNavigator />
            </HintProvider>
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;
