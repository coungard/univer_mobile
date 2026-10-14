import React from 'react';
import { View } from 'react-native';
import { libraryStyles, useLibraryColors } from '../theme/library';

/**
 * The design's 10 book-spine segments use this exact repeating order of the 5 spine colours
 * (indexes into the palette's `spines`), not just the 5 laid out twice — keep it as written.
 */
const SPINE_SEQUENCE = [0, 1, 2, 3, 4, 1, 0, 2, 4, 3];

const SPINE_BAND_HEIGHT = 160;

/**
 * The "Library" identity's top decorative band (a shelf of colored book spines) — shared between
 * `LoginScreen` and `RegisterRoleChoiceScreen` (issue #41) so the sequence and proportions only
 * live in one place.
 */
export function SpineBand() {
  const { spines } = useLibraryColors();
  const styles = useStyles();
  return (
    <View style={styles.spineBand}>
      <View style={styles.spineRow}>
        {SPINE_SEQUENCE.map((spine, index) => (
          <View key={index} style={[styles.spineSegment, { backgroundColor: spines[spine] }]} />
        ))}
      </View>
      <View style={styles.spineOverlay} />
    </View>
  );
}

const useStyles = libraryStyles((c) => ({
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
    backgroundColor: c.spineShade,
  },
}));
