import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { mediaUrl } from '../api/mediaUrl';
import { avatarUriOf } from '../features/profile/avatar';
import { libraryFonts } from '../theme/library';

interface AvatarProps {
  /** `avatarThumbnailUrl` for small circles, `avatarUrl` for big ones; none — the initials. */
  url?: string | null;
  initials: string;
  size: number;
  backgroundColor: string;
  textColor: string;
  /** An upload or removal is under way: a spinner over the circle. */
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

/**
 * A person's circle (issue #94): the photo over the initials. The initials are always drawn
 * underneath, so while a new photo loads, or if it fails to, the circle shows them instead of an empty
 * spot, and its size never changes — nothing around it moves when a photo comes or goes.
 */
export function Avatar({ url, initials, size, backgroundColor, textColor, busy, style, textStyle }: AvatarProps) {
  const uri = mediaUrl(avatarUriOf(url));
  // Remembered per link: a new photo gets a new link (univer#137), so it is tried afresh.
  const [failedUri, setFailedUri] = useState<string | undefined>();
  const showPhoto = uri !== undefined && uri !== failedUri;
  const circle = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View style={[styles.circle, circle, { backgroundColor }, style]}>
      <Text
        style={[styles.initials, { color: textColor, fontSize: Math.round(size * 0.36) }, textStyle]}
        allowFontScaling={false}
      >
        {initials}
      </Text>
      {showPhoto ? (
        <Image
          source={{ uri }}
          style={[StyleSheet.absoluteFill, circle]}
          onError={() => setFailedUri(uri)}
          accessibilityIgnoresInvertColors
        />
      ) : null}
      {busy ? (
        <View style={[StyleSheet.absoluteFill, styles.busy, circle]}>
          <ActivityIndicator color="#FAF4EE" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    fontFamily: libraryFonts.headingBold,
  },
  busy: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20, 15, 10, 0.45)',
  },
});
