import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { ErrorBanner } from '../../components/ErrorBanner';
import { useAuth } from '../../auth/useAuth';
import { AuthStackParamList } from '../../navigation/types';
import { libraryColors, libraryFonts } from '../../theme/library';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

/**
 * Order the design's "book spine" stripe uses across its 10 segments — not just the 5 palette
 * colors repeated in place, so keep this exact sequence rather than generating it.
 */
const SPINE_SEQUENCE = [
  libraryColors.terracotta,
  libraryColors.gold,
  libraryColors.sage,
  libraryColors.rust,
  libraryColors.navy,
  libraryColors.gold,
  libraryColors.terracotta,
  libraryColors.sage,
  libraryColors.navy,
  libraryColors.rust,
];

const SPINE_BAND_HEIGHT = 160;

function SpineBand() {
  return (
    <View style={styles.spineBand}>
      <View style={styles.spineRow}>
        {SPINE_SEQUENCE.map((color, index) => (
          <View key={index} style={[styles.spineSegment, { backgroundColor: color }]} />
        ))}
      </View>
      <View style={styles.spineOverlay} />
    </View>
  );
}

/**
 * View-based approximation of the design's book+pencil glyph (a stacked pair of books with a
 * diagonal bookmark/pencil across them) — drawn with plain `View`s instead of an SVG icon so this
 * screen doesn't need to add `react-native-svg` as a new native dependency for one decoration.
 */
function BookIcon() {
  return (
    <View style={styles.bookIcon}>
      <View style={styles.bookIconPencil} />
      <View style={styles.bookIconLeftBook} />
      <View style={styles.bookIconRightBook} />
      <View style={styles.bookIconBase} />
    </View>
  );
}

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
  spineBand: {
    height: SPINE_BAND_HEIGHT,
    width: '100%',
  },
  spineRow: {
    flex: 1,
    flexDirection: 'row',
  },
  spineSegment: {
    flex: 1,
  },
  spineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SPINE_BAND_HEIGHT * 0.61,
    backgroundColor: 'rgba(20, 15, 10, 0.18)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  bookIcon: {
    width: 64,
    height: 56,
  },
  bookIconBase: {
    position: 'absolute',
    left: 4,
    top: 36,
    width: 56,
    height: 8,
    borderRadius: 2,
    backgroundColor: libraryColors.terracotta,
  },
  bookIconLeftBook: {
    position: 'absolute',
    left: 6,
    top: 20,
    width: 20,
    height: 16,
    backgroundColor: libraryColors.gold,
    borderWidth: 1,
    borderColor: libraryColors.ink,
  },
  bookIconRightBook: {
    position: 'absolute',
    left: 30,
    top: 14,
    width: 24,
    height: 22,
    backgroundColor: libraryColors.surface,
    borderWidth: 1,
    borderColor: libraryColors.ink,
  },
  bookIconPencil: {
    position: 'absolute',
    left: 10,
    top: 2,
    width: 28,
    height: 12,
    backgroundColor: libraryColors.sage,
    borderWidth: 1,
    borderColor: libraryColors.ink,
    transform: [{ rotate: '8deg' }],
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
