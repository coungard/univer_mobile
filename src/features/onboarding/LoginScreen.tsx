import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { BookIcon } from '../../components/BookIcon';
import { ErrorBanner } from '../../components/ErrorBanner';
import { SpineBand } from '../../components/SpineBand';
import { useAuth } from '../../auth/useAuth';
import { AuthStackParamList } from '../../navigation/types';
import { libraryColors, libraryFonts } from '../../theme/library';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { isLoggingIn, loginError, login } = useAuth();

  return (
    <View style={styles.container}>
      {/* This screen keeps the "Library" brand identity's warm light palette regardless of the
          system color scheme (a fixed-light welcome/brand screen, same idea as a splash screen) —
          force a dark status bar here so its icons stay legible over the cream/colored background
          even when the rest of the app is in dark mode (App.tsx sets the global one from
          `useColorScheme()`; RN stacks `StatusBar` overrides and restores the one below on
          unmount). */}
      <StatusBar barStyle="dark-content" />
      <SpineBand />

      <ErrorBanner message={loginError} onDismiss={() => {}} />

      <View style={styles.content}>
        <BookIcon />
        <Text style={styles.title}>Univer</Text>
        <Text style={styles.subtitle}>Расписание, лекции и посещаемость</Text>
      </View>

      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={() => login()}
          loading={isLoggingIn}
          disabled={isLoggingIn}
          buttonColor={libraryColors.terracottaButton}
          textColor={libraryColors.cream}
          style={styles.primaryButton}
          contentStyle={styles.primaryButtonContent}
          labelStyle={styles.primaryButtonLabel}
        >
          Войти
        </Button>

        <Button
          mode="outlined"
          onPress={() => navigation.navigate('RegisterRoleChoice')}
          disabled={isLoggingIn}
          textColor={libraryColors.terracottaButton}
          style={styles.secondaryButton}
          contentStyle={styles.secondaryButtonContent}
          labelStyle={styles.secondaryButtonLabel}
        >
          Зарегистрироваться
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: libraryColors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  title: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 38,
    color: libraryColors.ink,
  },
  subtitle: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 14.5,
    textAlign: 'center',
    color: libraryColors.inkMuted,
    maxWidth: 240,
    lineHeight: 21,
  },
  actions: {
    paddingHorizontal: 32,
    paddingBottom: 30,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 6,
  },
  primaryButtonContent: {
    height: 56,
  },
  primaryButtonLabel: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 16,
  },
  secondaryButton: {
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: libraryColors.terracottaButton,
  },
  secondaryButtonContent: {
    height: 50,
  },
  secondaryButtonLabel: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 15,
  },
});
