/**
 * "Library" visual identity (issue #37/#38) — shared between the start screen (`LoginScreen`)
 * and the student registration screen so neither hardcodes its own copy of the palette.
 *
 * Colors are converted from the design canvas's oklch values
 * (https://claude.ai/artifact/8d4gEWpHreZ918n5byAyF3, concept "30 · Library") to sRGB hex, since
 * React Native's `StyleSheet` colors don't understand the CSS `oklch()` function. Font files live
 * in `assets/fonts/` — see `react-native.config.js` for how they're wired into each platform.
 */

import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

export const libraryColors = {
  background: '#F8F1E7',
  ink: '#271D17',
  inkMuted: 'rgba(39, 29, 23, 0.6)',
  inkFaint: 'rgba(39, 29, 23, 0.35)',
  border: 'rgba(39, 29, 23, 0.14)',
  terracotta: '#742F25',
  terracottaButton: '#6E2920',
  gold: '#C5953B',
  sage: '#295233',
  rust: '#924D35',
  navy: '#114054',
  cream: '#FAF4EE',
  surface: '#FEFBF7',
} as const;

/**
 * Bottom tab bar (issue #55): a dark bar, so the active tab takes a lightened tint of a spine
 * colour — the spine colours themselves are too dark to read on it.
 */
export const libraryTabBarColors = {
  background: libraryColors.ink,
  inactive: '#B9AEA2',
  profile: '#E08E78',
  schedule: '#8FC09A',
  courses: '#7FB4CF',
} as const;

/**
 * Newcomer hints (PLAN.md M20, «Ярлык»): a dark bubble like the tab bar, with a lightened gold for
 * the current stage and the button, and the spine gold for the frame around the target.
 */
export const libraryHintColors = {
  background: libraryColors.ink,
  text: libraryColors.cream,
  muted: '#B9AEA2',
  accent: '#E3B866',
  frame: libraryColors.gold,
  /** Fill of the schedule row a hint has just led to. */
  shown: 'rgba(197, 149, 59, 0.18)',
} as const;

/**
 * Dark theme (issue #60): the ink the dark pieces are drawn in nearly matches the dark screen
 * background, so there they take a lighter warm brown — still dark enough for cream text.
 */
export const libraryDarkColors = {
  /** «Вся неделя» spine and the hint bubble, in place of `ink`. */
  raisedInk: '#4A3B31',
  /** Top edge of the tab bar, which otherwise runs into the screen. */
  tabBarEdge: 'rgba(250, 244, 238, 0.12)',
} as const;

/** The book-spine stripe's 5 repeating colors, in the order the design uses them. */
export const librarySpineColors = [
  libraryColors.terracotta,
  libraryColors.gold,
  libraryColors.sage,
  libraryColors.rust,
  libraryColors.navy,
] as const;

/**
 * The colours of the Library screens (login, registration, the setup wizard, «Изменить название»)
 * in either theme (issue #62). The dark one is «Переплёт», picked on the canvas
 * https://claude.ai/artifact/WkjfMw5vtRmhnQwv45ZWXC: a warm near-black brown, cream text, and the
 * accents lightened like the tab bar's. Both have the same keys as `libraryColors`, so the named
 * accents (`terracotta`, `navy`, …) stay accents; things drawn as spines or book covers (the spine
 * band, the progress segments, the book icon, an avatar) take `spines`, which on the dark ground
 * are lightened only one step — the accents' lightness would make them pastel.
 */
const libraryLightPalette = {
  ...libraryColors,
  /** Header bar of these screens. Applied in the dark theme only; the light one keeps the navigator's. */
  header: libraryColors.surface,
  /** Label of a filled `terracottaButton`. */
  onButton: libraryColors.cream,
  /** Fill of a picked option, behind a `terracotta` border. */
  accentTint: 'rgba(116, 47, 37, 0.07)',
  navyTint: 'rgba(17, 64, 84, 0.05)',
  /** Field errors — Paper's own light error colour, which the dark theme would swap for a pale pink. */
  error: '#B3261E',
  /** Darker top half of each spine in the band. */
  spineShade: 'rgba(20, 15, 10, 0.18)',
  /** Outline and pages of the drawn books (`BookIcon`). */
  bookStroke: libraryColors.ink,
  bookPage: libraryColors.surface,
  /** Cards with cream text on the profile (issue #65): the nearest lecture, and an unfinished profile. */
  dayCard: libraryColors.navy,
  setupCard: libraryColors.terracotta,
  /** Fills of a marked lecture's time (issue #71, «Цвет времени»), behind `sage` «был» and `rust` «не был». */
  attendedTint: '#DCE8DE',
  missedTint: '#F0DDD4',
  spines: [libraryColors.terracotta, libraryColors.gold, libraryColors.sage, libraryColors.rust, libraryColors.navy],
};

export type LibraryPalette = { [K in Exclude<keyof typeof libraryLightPalette, 'spines'>]: string } & {
  spines: readonly string[];
};

const libraryDarkPalette: LibraryPalette = {
  background: '#1E1814',
  ink: '#F3EBE0',
  inkMuted: 'rgba(243, 235, 224, 0.68)',
  inkFaint: 'rgba(243, 235, 224, 0.42)',
  border: 'rgba(243, 235, 224, 0.14)',
  terracotta: libraryTabBarColors.profile,
  terracottaButton: libraryTabBarColors.profile,
  gold: libraryHintColors.accent,
  sage: libraryTabBarColors.schedule,
  rust: '#D99A7E',
  navy: libraryTabBarColors.courses,
  cream: libraryColors.cream,
  surface: '#2A211B',
  header: '#261E19',
  onButton: libraryColors.ink,
  accentTint: 'rgba(224, 142, 120, 0.12)',
  navyTint: 'rgba(127, 180, 207, 0.08)',
  error: '#FFB4A9',
  spineShade: 'rgba(0, 0, 0, 0.25)',
  bookStroke: '#1E1814',
  bookPage: '#F3EBE0',
  // Darker than the dark spines, so cream text keeps its contrast.
  dayCard: '#1F4F66',
  setupCard: '#8E3E30',
  attendedTint: 'rgba(143, 192, 154, 0.16)',
  missedTint: 'rgba(217, 154, 126, 0.16)',
  spines: ['#B4533F', '#D4A64E', '#4E8A5C', '#B56A4C', '#2F6F8C'],
};

/** The Library colours for the current theme. */
export function useLibraryColors(): LibraryPalette {
  return useTheme().dark ? libraryDarkPalette : libraryLightPalette;
}

/**
 * A `StyleSheet` built from the Library colours once per theme, at module load, and a hook that
 * picks the one for the current theme: `const useStyles = libraryStyles((c) => ({ … }))`, then
 * `const styles = useStyles()` inside the component.
 */
export function libraryStyles<T extends StyleSheet.NamedStyles<T>>(make: (c: LibraryPalette) => T): () => T {
  const light = StyleSheet.create(make(libraryLightPalette));
  const dark = StyleSheet.create(make(libraryDarkPalette));
  return function useLibraryStyles() {
    return useTheme().dark ? dark : light;
  };
}

/** Paper `theme` override for the outlined text fields of these screens. */
export function useLibraryFieldTheme() {
  const c = useLibraryColors();
  return useMemo(
    () => ({
      colors: {
        primary: c.terracottaButton,
        outline: c.border,
        background: c.surface,
        onSurfaceVariant: c.inkMuted,
        onSurface: c.ink,
        error: c.error,
      },
    }),
    [c],
  );
}

/**
 * Font family names to pass to `fontFamily` in a `StyleSheet`. These match both the bundled
 * files' names (how Android resolves a custom font) and each file's embedded PostScript name
 * (how iOS resolves one) — verified against the actual .ttf files, not assumed.
 *
 * Both families cover Cyrillic (issue #61): Lora 3.021 for headings, picked on the canvas
 * https://claude.ai/artifact/4JDLXxBy7uQovYDDmwWt2Z in place of Libre Baskerville, and Lato
 * 2.015 for body text — Google Fonts' Lato 1 had Latin only, so Russian text fell back to Roboto.
 */
export const libraryFonts = {
  headingRegular: 'Lora-Regular',
  headingBold: 'Lora-Bold',
  bodyRegular: 'Lato-Regular',
  bodyBold: 'Lato-Bold',
} as const;
