import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { StudentDto } from '../../api/types';
import { QueryErrorState } from '../../components/QueryErrorState';
import { StudentStackScreenProps } from '../../navigation/types';
import { libraryColors, libraryFonts } from '../../theme/library';
import { NewcomerState } from '../hints/newcomerState';
import { useNewcomer } from '../hints/useNewcomer';
import { useOwnStudentQuery } from '../profile/hooks';
import { useOwnUniversityRequestQuery } from './hooks';
import { stepStyles } from './RegistrationStep';

const RESUME_HINT = 'Продолжить можно в любой момент — в профиле появилась карточка «Завершить настройку».';

/**
 * Final-screen wording by how far the profile got (PLAN_FINISHED_01.MD, раздел 4.4). `requestedUniversity` is
 * the name from a request for a missing university sent just now, `pendingRequest` — the name from
 * one sent earlier and still waiting for an administrator. With a group the wording depends on
 * whether the group has a schedule at all (PLAN.md, M24): «расписание уже доступно» is only said
 * when it is.
 */
function describeOutcome(
  student: StudentDto,
  newcomer: NewcomerState,
  requestedUniversity?: string,
  pendingRequest?: string,
): { title: string; text: string } {
  if (requestedUniversity && !student.universityId) {
    return {
      title: 'Заявка отправлена',
      text: `Мы добавим «${requestedUniversity}» в список. Продолжить настройку можно будет из профиля.`,
    };
  }
  if (student.groupId) {
    if (newcomer.kind === 'settled') {
      return { title: 'Готово', text: 'Вы в своей группе — расписание уже доступно.' };
    }
    if (newcomer.kind === 'closed') {
      return {
        title: 'Вы в своей группе',
        text: 'Расписание группы не заполнено и уже согласовано — обратитесь к администратору.',
      };
    }
    if (newcomer.kind === 'newcomer') {
      return {
        title: 'Группа есть',
        text: 'Факультет и группа готовы. Остался последний шаг — первая пара в расписании группы.',
      };
    }
    // Pairs are still loading (or failed to): say only what is certain.
    return { title: 'Готово', text: 'Вы в своей группе.' };
  }
  if (student.yearNumber != null) {
    return {
      title: 'Почти готово',
      text: `Факультет и курс сохранены, осталась группа. Если её нет в списке — создайте её сами. ${RESUME_HINT}`,
    };
  }
  if (student.facultyId) {
    return { title: 'Почти готово', text: `Факультет сохранён, остались курс и группа. ${RESUME_HINT}` };
  }
  if (student.universityId) {
    return {
      title: 'Профиль создан',
      text: `Университет сохранён, факультет не выбран. Если его нет в списке — создайте его сами. ${RESUME_HINT}`,
    };
  }
  if (pendingRequest) {
    return {
      title: 'Профиль создан',
      text: `Университет не выбран. Заявка на «${pendingRequest}» отправлена — мы добавим его в список. ${RESUME_HINT}`,
    };
  }
  return {
    title: 'Профиль создан',
    text: `Университет не выбран. Если его нет в списке — оставьте заявку на добавление. ${RESUME_HINT}`,
  };
}

/**
 * Final screen of the student setup wizard (PLAN_FINISHED_01.MD): reached both by finishing step 6 and by
 * leaving any step early, so it reads the saved profile and says what is done and what is missing.
 */
export function StudentSetupDoneScreen({ navigation, route }: StudentStackScreenProps<'SetupDone'>) {
  const student = useOwnStudentQuery();
  const request = useOwnUniversityRequestQuery(!!student.data && !student.data.universityId);
  const newcomer = useNewcomer();

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

  const { title, text } = describeOutcome(
    student.data,
    newcomer,
    route.params?.requestedUniversity,
    request.data?.status === 'PENDING' ? request.data.name : undefined,
  );
  const hasGroup = !!student.data.groupId;
  // A newcomer with a group goes on to the first pair instead of an empty schedule.
  const toFirstPair = hasGroup && newcomer.kind === 'newcomer' && newcomer.missing === 'pair';

  const onPrimary = () => {
    navigation.popTo('Tabs', { screen: hasGroup ? 'Schedule' : 'Profile' });
    // On top of the schedule tab, so «Назад» from the group's schedule leads there.
    if (toFirstPair) navigation.navigate('GroupSchedule');
  };

  return (
    <View style={[stepStyles.screen, styles.container]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{text}</Text>
      {/* No hint bubble here: the screen itself says what the next step is, and a bubble under the
          button would cover «Перейти в профиль». */}
      <Button
        mode="contained"
        onPress={onPrimary}
        buttonColor={libraryColors.terracottaButton}
        textColor={libraryColors.cream}
        style={[stepStyles.primaryButton, styles.button]}
        contentStyle={stepStyles.primaryButtonContent}
        labelStyle={stepStyles.primaryButtonLabel}
      >
        {toFirstPair ? 'Добавить первую пару' : hasGroup ? 'Открыть расписание' : 'Перейти в профиль'}
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
