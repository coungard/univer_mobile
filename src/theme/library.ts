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
