/**
 * Custom fonts: the "Library" visual identity (issue #37/#38, Libre Baskerville + Lato) plus
 * react-native-vector-icons' MaterialCommunityIcons, which react-native-paper's icon props
 * (e.g. TextInput.Icon) render through — without it, icons show as a missing-glyph box.
 * `assets/fonts/*.ttf` is the source of truth; the files are also copied into
 * `android/app/src/main/assets/fonts/` (Android reads fonts straight from there, no further
 * linking needed) and `ios/univer_mobile/Fonts/` + `Info.plist`'s `UIAppFonts` (iOS additionally
 * needs those files added to the Xcode project's "Copy Bundle Resources" build phase — a
 * Mac/Xcode step this repo can't perform from here). Re-run `npx react-native-asset` after
 * adding/removing a font file to redo that copy automatically instead of by hand.
 */
module.exports = {
  assets: ['./assets/fonts'],
};
