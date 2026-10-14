import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { StatusBar, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { BookIcon } from '../../components/BookIcon';
import { ErrorBanner } from '../../components/ErrorBanner';
import { SpineBand } from '../../components/SpineBand';
import { useAuth } from '../../auth/useAuth';
import { AuthStackParamList } from '../../navigation/types';
import { libraryFonts, libraryStyles, useLibraryColors } from '../../theme/library';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const c = useLibraryColors();
  const styles = useStyles();
  const { dark } = useTheme();
  const { isLoggingIn, loginError, login } = useAuth();

  return (
    <View style={styles.container}>
      {/* The status bar sits over the spine band: dark icons over the light theme's spines, light
          ones over the dark theme's «Переплёт» (issue #62). RN stacks `StatusBar` overrides and
          restores the one below (App.tsx's) on unmount. */}
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
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
          buttonColor={c.terracottaButton}
          textColor={c.onButton}
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
          textColor={c.terracottaButton}
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

const useStyles = libraryStyles((c) => ({
  container: {
    flex: 1,
    backgroundColor: c.background,
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
    color: c.ink,
  },
  subtitle: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 14.5,
    textAlign: 'center',
    color: c.inkMuted,
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
    borderColor: c.terracottaButton,
  },
  secondaryButtonContent: {
    height: 50,
  },
  secondaryButtonLabel: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 15,
  },
}));
