import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { useGroupAcademicPathQuery } from '../profile/hooks';

interface Props {
  groupId: string | null | undefined;
  style?: StyleProp<ViewStyle>;
  /** Centers both lines — for the empty states, where everything else is centered. */
  centered?: boolean;
}

/**
 * Whose schedule this is, in small muted type on the schedule screens (issue #58): the faculty on
 * top, the group under it. The faculty may take two lines — next to a button there is no room for
 * a long name in one. The same queries the profile makes, so it costs nothing extra there. Nothing
 * without a group; a failed request just leaves the lines empty.
 */
export function GroupCaption({ groupId, style, centered }: Props) {
  const { group, faculty } = useGroupAcademicPathQuery(groupId);
  if (!groupId) return null;

  return (
    <View style={style}>
      <Text variant="bodySmall" numberOfLines={2} style={[styles.line, centered && styles.centered]}>
        {faculty?.name ?? ''}
      </Text>
      <Text variant="bodySmall" numberOfLines={1} style={[styles.line, centered && styles.centered]}>
        {group?.name ?? ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    opacity: 0.6,
  },
  centered: {
    textAlign: 'center',
  },
});
