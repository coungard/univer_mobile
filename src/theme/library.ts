/**
 * "Library" visual identity (issue #37/#38) — shared between the start screen (`LoginScreen`)
 * and the student registration screen so neither hardcodes its own copy of the palette.
 *
 * Colors are converted from the design canvas's oklch values
 * (https://claude.ai/artifact/8d4gEWpHreZ918n5byAyF3, concept "30 · Library") to sRGB hex, since
 * React Native's `StyleSheet` colors don't understand the CSS `oklch()` function. Font files live
 * in `assets/fonts/` — see `react-native.config.js` for how they're wired into each platform.
 */

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

/** The book-spine stripe's 5 repeating colors, in the order the design uses them. */
export const librarySpineColors = [
  libraryColors.terracotta,
  libraryColors.gold,
  libraryColors.sage,
  libraryColors.rust,
  libraryColors.navy,
] as const;

/**
 * Font family names to pass to `fontFamily` in a `StyleSheet`. These match both the bundled
 * files' names (how Android resolves a custom font) and each file's embedded PostScript name
 * (how iOS resolves one) — verified against the actual .ttf files, not assumed.
 */
export const libraryFonts = {
  headingRegular: 'LibreBaskerville-Regular',
  headingBold: 'LibreBaskerville-Bold',
  bodyRegular: 'Lato-Regular',
  bodyBold: 'Lato-Bold',
} as const;
