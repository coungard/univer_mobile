import React from 'react';
import { View } from 'react-native';
import { libraryStyles } from '../theme/library';

/**
 * View-based approximation of the "Library" identity's book+pencil glyph (a stacked pair of books
 * with a diagonal bookmark/pencil across them) — plain `View`s instead of an SVG icon so no screen
 * needs `react-native-svg` as a new native dependency for one decoration. Shared between
 * `LoginScreen` and `RegisterRoleChoiceScreen` (issue #41).
 */
export function BookIcon() {
  const styles = useStyles();
  return (
    <View style={styles.bookIcon}>
      <View style={styles.bookIconPencil} />
      <View style={styles.bookIconLeftBook} />
      <View style={styles.bookIconRightBook} />
      <View style={styles.bookIconBase} />
    </View>
  );
}

const useStyles = libraryStyles((c) => ({
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
    backgroundColor: c.spines[0],
  },
  bookIconLeftBook: {
    position: 'absolute',
    left: 6,
    top: 20,
    width: 20,
    height: 16,
    backgroundColor: c.spines[1],
    borderWidth: 1,
    borderColor: c.bookStroke,
  },
  bookIconRightBook: {
    position: 'absolute',
    left: 30,
    top: 14,
    width: 24,
    height: 22,
    backgroundColor: c.bookPage,
    borderWidth: 1,
    borderColor: c.bookStroke,
  },
  bookIconPencil: {
    position: 'absolute',
    left: 10,
    top: 2,
    width: 28,
    height: 12,
    backgroundColor: c.spines[2],
    borderWidth: 1,
    borderColor: c.bookStroke,
    transform: [{ rotate: '8deg' }],
  },
}));
