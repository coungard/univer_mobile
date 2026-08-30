import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

/**
 * Shown while `restoreSession()` (see `src/auth/sessionManager.ts`) checks the keychain for an
 * existing session. `RootNavigator` renders this in place of any navigator — there is nothing to
 * navigate to yet, since we don't know if the user is logged in.
 */
export function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Univer
      </Text>
      <ActivityIndicator animating size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  title: {
    fontWeight: '600',
  },
});
