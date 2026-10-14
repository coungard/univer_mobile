import React from 'react';
import { Text, View } from 'react-native';
import { libraryFonts, libraryStyles, useLibraryColors } from '../../theme/library';

interface Props {
  firstname: string;
  lastname: string;
  username: string;
  position: string;
}

/**
 * Live "teacher card" preview pinned above the registration form (issue #45), mirroring
 * `StudentIdCard`'s ticket-stub look but for a lecturer: shows the chosen position once it's
 * been typed in.
 */
export function TeacherIdCard({ firstname, lastname, username, position }: Props) {
  const styles = useStyles();
  const fullName = `${firstname} ${lastname}`.trim();
  const initials = `${firstname.trim().charAt(0)}${lastname.trim().charAt(0)}`.toUpperCase();
  const role = position;

  const { spines } = useLibraryColors();
  return (
    <View style={styles.card}>
      <View style={styles.spine}>
        {spines.map((color) => (
          <View key={color} style={[styles.spineSegment, { backgroundColor: color }]} />
        ))}
      </View>

      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Преподаватель</Text>
          <Text style={styles.wordmark}>Univer</Text>
        </View>

        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.identityText}>
            <Text style={[styles.name, !fullName && styles.placeholder]} numberOfLines={1}>
              {fullName || 'Имя Фамилия'}
            </Text>
            <Text style={[styles.handle, !username && styles.placeholder]} numberOfLines={1}>
              {username ? `@${username}` : '@логин'}
            </Text>
          </View>
        </View>

        {!!role && (
          <Text style={styles.role} numberOfLines={1}>
            {role}
          </Text>
        )}
      </View>
    </View>
  );
}

const useStyles = libraryStyles((c) => ({
  card: {
    borderRadius: 16,
    backgroundColor: c.surface,
    overflow: 'hidden',
    shadowColor: c.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 3,
  },
  spine: {
    flexDirection: 'row',
    height: 7,
  },
  spineSegment: {
    flex: 1,
  },
  body: {
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: c.terracotta,
  },
  wordmark: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 12,
    color: c.inkMuted,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: c.spines[0],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 17,
    color: c.cream,
  },
  identityText: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 17,
    color: c.ink,
  },
  handle: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 12,
    color: c.inkMuted,
  },
  placeholder: {
    color: c.inkFaint,
  },
  role: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 12,
    color: c.rust,
  },
}));
