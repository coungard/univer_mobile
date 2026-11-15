import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { TeacherDto } from '../../api/types';
import { Avatar } from '../../components/Avatar';
import { useLibraryColors } from '../../theme/library';
import { initialsOf } from '../profile/avatar';

interface Props {
  name: string;
  /** The registered teacher, once loaded; none — a name typed into the pair, drawn without a circle. */
  teacher?: TeacherDto;
  /** A registered teacher still loading: the circle keeps its place, so the name doesn't shift. */
  loading?: boolean;
}

/**
 * «Преподаватель» in a lecture's and a course's details (issue #94): the teacher's photo next to the
 * name. The links are public (univer#137), so any role sees them; without a photo — the initials.
 */
export function TeacherWithPhoto({ name, teacher, loading }: Props) {
  const c = useLibraryColors();
  if (!teacher && !loading) return <Text variant="bodyLarge">{name}</Text>;
  const initials = teacher ? initialsOf(teacher) : '';
  return (
    <View style={styles.row}>
      <Avatar
        url={teacher?.avatarThumbnailUrl}
        initials={initials}
        size={40}
        backgroundColor={c.spines[4]}
        textColor={c.cream}
      />
      <Text variant="bodyLarge" style={styles.name}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  name: {
    flex: 1,
  },
});
