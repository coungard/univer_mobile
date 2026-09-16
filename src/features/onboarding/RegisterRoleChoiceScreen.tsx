import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BookIcon } from '../../components/BookIcon';
import { SpineBand } from '../../components/SpineBand';
import { AuthStackParamList } from '../../navigation/types';
import { libraryColors, libraryFonts } from '../../theme/library';

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterRoleChoice'>;

/** View-based lectern glyph for the teacher role card, drawn the same way as `BookIcon`. */
function TeacherIcon() {
  return (
    <View style={styles.teacherIcon}>
      <View style={styles.teacherIconBase} />
      <View style={styles.teacherIconStand} />
      <View style={styles.teacherIconBoard} />
    </View>
  );
}

interface RoleCardProps {
  accent: string;
  accentTint: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}

function RoleCard({ accent, accentTint, icon, title, subtitle, onPress }: RoleCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        { borderColor: accent, backgroundColor: accentTint, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      {icon}
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      <Text style={[styles.chevron, { color: accent }]}>›</Text>
    </Pressable>
  );
}

export function RegisterRoleChoiceScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <SpineBand />

      <View style={styles.content}>
        <View style={styles.heading}>
          <BookIcon />
          <Text style={styles.title}>Кто вы?</Text>
          <Text style={styles.subtitle}>Это определит, какие данные понадобятся дальше</Text>
        </View>

        <View style={styles.cards}>
          <RoleCard
            accent={libraryColors.terracotta}
            accentTint="rgba(116, 47, 37, 0.07)"
            icon={<BookIcon />}
            title="Я студент"
            subtitle="Смотрю расписание и лекции"
            onPress={() => navigation.navigate('RegisterStudent')}
          />
          <RoleCard
            accent={libraryColors.navy}
            accentTint="rgba(17, 64, 84, 0.05)"
            icon={<TeacherIcon />}
            title="Я преподаватель"
            subtitle="Веду занятия и группы"
            onPress={() => navigation.navigate('RegisterTeacher')}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: libraryColors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 30,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  heading: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 25,
    color: libraryColors.ink,
  },
  subtitle: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 13,
    textAlign: 'center',
    color: libraryColors.inkMuted,
    maxWidth: 230,
    lineHeight: 19,
  },
  cards: {
    gap: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    minHeight: 44,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 16,
    color: libraryColors.ink,
  },
  cardSubtitle: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 12,
    color: libraryColors.inkMuted,
    marginTop: 2,
  },
  chevron: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 20,
    lineHeight: 20,
  },
  teacherIcon: {
    width: 64,
    height: 56,
  },
  teacherIconBase: {
    position: 'absolute',
    bottom: 6,
    left: 8,
    width: 48,
    height: 5,
    borderRadius: 2,
    backgroundColor: libraryColors.navy,
  },
  teacherIconStand: {
    position: 'absolute',
    bottom: 11,
    left: 28,
    width: 8,
    height: 30,
    borderRadius: 2,
    backgroundColor: libraryColors.navy,
  },
  teacherIconBoard: {
    position: 'absolute',
    top: 0,
    left: 15,
    width: 34,
    height: 26,
    borderRadius: 999,
    backgroundColor: libraryColors.surface,
    borderWidth: 2,
    borderColor: libraryColors.navy,
  },
});
