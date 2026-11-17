/**
 * The round profile photo used everywhere a person is shown (issue #94): the owner's editable circle
 * on the profile, the student's ticket, and the teacher next to a lecture or course. Without a photo
 * it falls back to initials on the «Переплёт» terracotta, so the layout never collapses.
 */
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { libraryFonts, useLibraryColors } from '../theme/library';

interface AvatarProps {
  /** Photo URL — `avatarThumbnailUrl` outside the owner's profile. */
  uri?: string | null;
  /** Fallback letters, see `initialsOf`; not rendered when `uri` loads. */
  initials: string;
  /** Diameter in points; the initials scale with it. */
  size: number;
  /** Font size for the initials; defaults to a bit over a third of the diameter. */
  initialsFontSize?: number;
  /** Overlays on top of the circle — the upload spinner of `EditableAvatar`. */
  children?: React.ReactNode;
}

export function Avatar({ uri, initials, size, initialsFontSize, children }: AvatarProps) {
  const c = useLibraryColors();
  const radius = size / 2;

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: radius, backgroundColor: c.spines[0] }]}>
      {uri ? (
        <Image source={{ uri }} style={styles.image} resizeMode="cover" />
      ) : (
        <Text
          style={[
            styles.initials,
            { color: c.cream, fontSize: initialsFontSize ?? Math.round(size * 0.36) },
          ]}
        >
          {initials}
        </Text>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  initials: {
    fontFamily: libraryFonts.headingBold,
  },
});
