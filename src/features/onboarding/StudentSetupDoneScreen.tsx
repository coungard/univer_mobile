import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { StudentDto } from '../../api/types';
import { QueryErrorState } from '../../components/QueryErrorState';
import { StudentStackScreenProps } from '../../navigation/types';
import { libraryColors, libraryFonts } from '../../theme/library';
import { useOwnStudentQuery } from '../profile/hooks';
import { stepStyles } from './RegistrationStep';

const RESUME_HINT = 'Продолжить можно в любой момент — в профиле появилась карточка «Завершить настройку».';

/** Final-screen wording by how far the profile got (PLAN.md, раздел 4.4). */
function describeOutcome(student: StudentDto): { title: string; text: string } {
  if (student.groupId) {
    return { title: 'Готово', text: 'Вы в своей группе — расписание уже доступно.' };
  }
  if (student.yearNumber != null) {
    return {
      title: 'Почти готово',
      text: `Факультет и курс сохранены, осталась группа. Если её пока нет в списке — загляните позже. ${RESUME_HINT}`,
    };
  }
  if (student.facultyId) {
    return { title: 'Почти готово', text: `Факультет сохранён, остались курс и группа. ${RESUME_HINT}` };
  }
  if (student.universityId) {
    return {
      title: 'Профиль создан',
      text: `Университет сохранён, факультет не выбран. Если его пока нет в списке — загляните позже. ${RESUME_HINT}`,
    };
  }
  return {
    title: 'Профиль создан',
    text: `Университет не выбран. Если его пока нет в списке — загляните позже. ${RESUME_HINT}`,
  };
}

/**
 * Final screen of the student setup wizard (PLAN.md): reached both by finishing step 6 and by
 * leaving any step early, so it reads the saved profile and says what is done and what is missing.
 */
export function StudentSetupDoneScreen({ navigation }: StudentStackScreenProps<'SetupDone'>) {
  const student = useOwnStudentQuery();

  if (student.isPending) {
    return (
      <View style={[stepStyles.screen, stepStyles.centered]}>
        <ActivityIndicator color={libraryColors.terracotta} />
      </View>
    );
  }

  if (student.isError) {
    return (
      <View style={[stepStyles.screen, stepStyles.centered]}>
        <QueryErrorState error={student.error} onRetry={() => student.refetch()} />
      </View>
    );
  }

  const { title, text } = describeOutcome(student.data);
  const hasGroup = !!student.data.groupId;

  return (
    <View style={[stepStyles.screen, styles.container]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{text}</Text>
      <Button
        mode="contained"
        onPress={() => navigation.popTo('Tabs', { screen: hasGroup ? 'Schedule' : 'Profile' })}
        buttonColor={libraryColors.terracottaButton}
        textColor={libraryColors.cream}
        style={[stepStyles.primaryButton, styles.button]}
        contentStyle={stepStyles.primaryButtonContent}
        labelStyle={stepStyles.primaryButtonLabel}
      >
        {hasGroup ? 'Открыть расписание' : 'Перейти в профиль'}
      </Button>
      {hasGroup ? (
        <Button
          mode="text"
          onPress={() => navigation.popTo('Tabs', { screen: 'Profile' })}
          textColor={libraryColors.terracottaButton}
          labelStyle={stepStyles.footerLinkLabel}
        >
          Перейти в профиль
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 26,
    color: libraryColors.ink,
    textAlign: 'center',
  },
  text: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 14,
    lineHeight: 20,
    color: libraryColors.inkMuted,
    textAlign: 'center',
  },
  button: {
    marginTop: 12,
  },
});
