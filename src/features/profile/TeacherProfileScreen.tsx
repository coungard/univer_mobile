import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useAuth } from '../../auth/useAuth';
import { QueryErrorState } from '../../components/QueryErrorState';
import { TeacherTabScreenProps } from '../../navigation/types';
import { DeleteAccountLink } from '../account/DeleteAccountScreens';
import { FeedbackLink } from '../feedback/FeedbackScreens';
import { GenderSetting } from './GenderSetting';
import { useFacultyQuery, useOwnTeacherQuery, useUpdateOwnTeacherGenderMutation } from './hooks';

/**
 * Профиль преподавателя — таб «Профиль» в `TeacherTabs` (ROADMAP.md "Фаза 6"), рядом с «Курсы» и
 * «Лекции» (`TeacherCoursesScreen`/`TeacherLecturesScreen`).
 */
export function TeacherProfileScreen() {
  const navigation = useNavigation<TeacherTabScreenProps<'Profile'>['navigation']>();
  const { logout } = useAuth();
  const teacher = useOwnTeacherQuery();
  const faculty = useFacultyQuery(teacher.data?.facultyId);
  const saveGender = useUpdateOwnTeacherGenderMutation();

  if (teacher.isLoading) {
    return (
      <View style={styles.center}>
        <Text>Загрузка профиля…</Text>
      </View>
    );
  }

  if (teacher.isError || !teacher.data) {
    return (
      <View style={styles.center}>
        <QueryErrorState error={teacher.error} onRetry={() => teacher.refetch()} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall">{teacher.data.fullname || teacher.data.username}</Text>
      <Text variant="bodyMedium" style={styles.email}>
        {teacher.data.email}
      </Text>
      <Text variant="bodyMedium">{teacher.data.position}</Text>
      <Text variant="bodyMedium" style={styles.faculty}>
        {faculty.data?.name ?? ''}
      </Text>

      {/* For teachers who registered before it was asked, and to fix a wrong pick (issue #92). */}
      <Text variant="bodyMedium" style={styles.genderLabel}>
        Пол
      </Text>
      <GenderSetting value={teacher.data.gender} save={saveGender} />

      <Button mode="outlined" onPress={() => logout()} style={styles.logout}>
        Выйти
      </Button>
      <DeleteAccountLink onPress={() => navigation.navigate('DeleteAccount')} />

      <View style={styles.feedbackSpacer} />
      <FeedbackLink onPress={() => navigation.navigate('Feedback')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 4,
  },
  feedbackSpacer: {
    flexGrow: 1,
    minHeight: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  email: {
    opacity: 0.7,
    marginBottom: 8,
  },
  faculty: {
    opacity: 0.7,
    marginBottom: 16,
  },
  genderLabel: {
    opacity: 0.7,
    marginBottom: 4,
  },
  logout: {
    marginTop: 24,
  },
});
