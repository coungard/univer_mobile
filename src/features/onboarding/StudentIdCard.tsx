import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { libraryColors, libraryFonts, librarySpineColors } from '../../theme/library';

interface Props {
  firstname: string;
  lastname: string;
  username: string;
}

/**
 * Live "student ID card" preview pinned above the registration form (issue #38, design concept
 * "25 · Билет — корешок") — genuinely reflects what's been typed so far rather than showing fixed
 * sample data, including the empty state before the student has typed anything.
 */
export function StudentIdCard({ firstname, lastname, username }: Props) {
  const fullName = `${firstname} ${lastname}`.trim();
  const initials = `${firstname.trim().charAt(0)}${lastname.trim().charAt(0)}`.toUpperCase();

  return (
    <View style={styles.card}>
      <View style={styles.spine}>
        {librarySpineColors.map((color) => (
          <View key={color} style={[styles.spineSegment, { backgroundColor: color }]} />
        ))}
      </View>

      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Студенческий билет</Text>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: libraryColors.surface,
    overflow: 'hidden',
    shadowColor: libraryColors.ink,
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
    color: libraryColors.terracotta,
  },
  wordmark: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 12,
    color: libraryColors.inkMuted,
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
    backgroundColor: libraryColors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 17,
    color: libraryColors.cream,
  },
  identityText: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 17,
    color: libraryColors.ink,
  },
  handle: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 12,
    color: libraryColors.inkMuted,
  },
  placeholder: {
    color: libraryColors.inkFaint,
  },
});
