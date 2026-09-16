import React from 'react';
import { StyleSheet, View } from 'react-native';
import { libraryColors } from '../theme/library';

/**
 * The design's 10 book-spine segments use this exact repeating order, not just the 5 palette
 * colors laid out twice — keep it as written rather than generating it.
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

/**
 * The "Library" identity's top decorative band (a shelf of colored book spines) — shared between
 * `LoginScreen` and `RegisterRoleChoiceScreen` (issue #41) so the sequence and proportions only
 * live in one place.
 */
export function SpineBand() {
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

const styles = StyleSheet.create({
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
});
