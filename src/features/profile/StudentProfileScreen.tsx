import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LectureDto } from '../../api/types';
import { QueryErrorState } from '../../components/QueryErrorState';
import { StudentTabScreenProps } from '../../navigation/types';
import { libraryFonts, libraryHintColors, libraryStyles, useLibraryColors } from '../../theme/library';
import { Hint } from '../hints/Hint';
import { useNewcomer } from '../hints/useNewcomer';
import { useOwnUniversityRequestQuery } from '../onboarding/hooks';
import { firstUnfilledSetupStep, openSetupAt, useSetupPromptStore } from '../onboarding/studentSetup';
import { formatDayDate, formatTime, shortDayName } from '../schedule/dateUtils';
import { useMyLecturesQuery } from '../schedule/hooks';
import {
  useFacultyQuery,
  useGroupAcademicPathQuery,
  useOwnStudentQuery,
  useOwnUserId,
  useUniversityQuery,
} from './hooks';
import { greeting, lectureDayLabel, lectureEnd, setupSteps, stepsLeftTitle, upcomingLectures } from './profileDay';

type Navigation = StudentTabScreenProps<'Profile'>['navigation'];

/**
 * Таб «Профиль» для студента, вариант «Карточка дня» (issue #65, холст
 * https://claude.ai/artifact/8upAhjkzDQMuD7VvFtfMHe). Главное на экране — ближайшее занятие, а пока
 * профиль не заполнен — то, что осталось до расписания; ниже компактный студенческий билет и поля.
 * Студент сам заполняет цепочку университет → факультет → курс → группа в мастере
 * (PLAN_FINISHED_01.MD) и может остановиться на любом звене; один раз за запуск приложения мастер для
 * незаполненного профиля открывается сам — так сразу после регистрации студент попадает на шаг 2.
 */
export function StudentProfileScreen() {
  const navigation = useNavigation<Navigation>();
  const c = useLibraryColors();
  const styles = useStyles();
  // The tabs render without a header, so nothing else keeps the greeting off the status bar.
  const insets = useSafeAreaInsets();
  const userId = useOwnUserId();
  const student = useOwnStudentQuery();
  const university = useUniversityQuery(student.data?.universityId ?? undefined);
  const ownFaculty = useFacultyQuery(student.data?.facultyId ?? undefined);
  const academicPath = useGroupAcademicPathQuery(student.data?.groupId);
  const lectures = useMyLecturesQuery();
  // A request for a missing university matters only while the profile has no university; a
  // completed one whose university the student later dropped reads as "no request".
  const universityRequest = useOwnUniversityRequestQuery(!!student.data && !student.data.universityId);
  const request =
    !student.data?.universityId && universityRequest.data && universityRequest.data.status !== 'COMPLETED'
      ? universityRequest.data
      : null;

  const setupStep = student.data ? firstUnfilledSetupStep(student.data) : null;
  const newcomer = useNewcomer();
  const promptedFor = useSetupPromptStore((state) => state.promptedFor);
  const markPrompted = useSetupPromptStore((state) => state.markPrompted);

  useEffect(() => {
    if (!setupStep || !userId || promptedFor === userId) return;
    markPrompted(userId);
    openSetupAt(setupStep, (route) => navigation.navigate(route));
  }, [setupStep, userId, promptedFor, markPrompted, navigation]);

  if (student.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={c.terracotta} />
      </View>
    );
  }

  if (student.isError || !student.data) {
    return (
      <View style={styles.center}>
        <QueryErrorState error={student.error} onRetry={() => student.refetch()} />
      </View>
    );
  }

  const now = new Date();
  const hasGroup = student.data.groupId != null;
  const universityName = university.data?.name;
  // A group assigned by an administrator may come without `facultyId` — fall back to the group's own chain.
  const facultyName = ownFaculty.data?.name ?? academicPath.faculty?.name;
  const facultyLoading = ownFaculty.isLoading || academicPath.isLoading;
  const group = academicPath.group;
  const groupFullName = group?.fullName?.trim() || undefined;
  // Only what the student created themselves can be renamed by them; whether somebody else has
  // picked it since is known only to the server (`422` on saving).
  const canRenameFaculty = !!ownFaculty.data && ownFaculty.data.createdByStudentId === student.data.id;
  const canRenameGroup = !!group && group.createdByStudentId === student.data.id;

  const ticketLine = hasGroup
    ? [group?.name ?? '…', student.data.yearNumber != null ? `${student.data.yearNumber} курс` : null, universityName]
        .filter(Boolean)
        .join(' · ')
    : [`@${student.data.username}`, universityName].filter(Boolean).join(' · ');
  const initials = `${student.data.firstname.trim().charAt(0)}${student.data.lastname.trim().charAt(0)}`.toUpperCase();

  const openSetup = () => setupStep && openSetupAt(setupStep, (route) => navigation.navigate(route));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>{greeting(now)}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {student.data.firstname || student.data.username}
          </Text>
        </View>
        {/* The hints, the theme and signing out live there (issue #60): this tab is about the student. */}
        <IconButton
          icon="cog-outline"
          accessibilityLabel="Настройки"
          iconColor={c.ink}
          size={22}
          mode="outlined"
          containerColor={c.surface}
          style={styles.settings}
          onPress={() => navigation.navigate('Settings')}
        />
      </View>

      {setupStep ? (
        <SetupCard
          steps={setupSteps(student.data, universityName)}
          requestText={
            request
              ? request.status === 'PENDING'
                ? `Заявка на «${request.name}» отправлена — мы добавим его в список.`
                : `Заявка на «${request.name}» отклонена.`
              : undefined
          }
          requestComment={request?.status === 'REJECTED' ? request.comment : undefined}
          hint={
            <Hint
              id="setup-start"
              stage={newcomer.kind === 'newcomer' ? newcomer.stage : 0}
              text="До расписания три шага: факультет, группа и первая пара. Начнём?"
              active={newcomer.kind === 'newcomer'}
            >
              <Button
                mode="contained"
                buttonColor={c.cream}
                textColor={c.setupCard}
                style={styles.cardButton}
                contentStyle={styles.cardButtonContent}
                labelStyle={styles.cardButtonLabel}
                onPress={openSetup}
              >
                Продолжить настройку
              </Button>
            </Hint>
          }
        />
      ) : (
        <DayCard
          lectures={lectures.data}
          loading={lectures.isLoading || newcomer.kind === 'unknown'}
          newcomerKind={newcomer.kind}
          now={now}
          onOpenLecture={(lecture) =>
            navigation.navigate('Schedule', { showLectureId: lecture.id, firstPair: undefined })
          }
          onOpenSchedule={() => navigation.navigate('Schedule', undefined)}
          onFirstPair={() => navigation.navigate('GroupSchedule')}
        />
      )}

      <View style={styles.ticket}>
        <View style={styles.ticketSpine}>
          {c.spines.map((color) => (
            <View key={color} style={[styles.ticketSpineSegment, { backgroundColor: color }]} />
          ))}
        </View>
        <View style={styles.ticketBody}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.ticketText}>
            <Text style={styles.ticketName} numberOfLines={1}>
              {student.data.fullname || `${student.data.firstname} ${student.data.lastname}`.trim()}
            </Text>
            <Text style={styles.ticketLine} numberOfLines={1}>
              {ticketLine}
            </Text>
          </View>
          <Text style={styles.ticketMark}>БИЛЕТ</Text>
        </View>
      </View>

      <View>
        {student.data.facultyId || hasGroup ? (
          <Field
            label="Факультет"
            value={facultyName ?? (facultyLoading ? '…' : '—')}
            onRename={canRenameFaculty ? () => navigation.navigate('RenameOwn', { kind: 'faculty' }) : undefined}
            renameLabel="Изменить название факультета"
          />
        ) : null}
        {hasGroup ? (
          <Field
            label={student.data.yearNumber != null ? `Группа · ${student.data.yearNumber} курс` : 'Группа'}
            value={group?.name ?? (academicPath.isLoading ? '…' : '—')}
            detail={groupFullName !== group?.name ? groupFullName : undefined}
            onRename={canRenameGroup ? () => navigation.navigate('RenameOwn', { kind: 'group' }) : undefined}
            renameLabel="Изменить название группы"
          />
        ) : null}
        {student.data.enrollmentDate ? (
          <Field label="Дата зачисления" value={formatIsoDate(student.data.enrollmentDate)} />
        ) : null}
        <Field label="Email" value={student.data.email} last />
      </View>

      {student.data.universityId ? (
        // The wizard resumes at the first unfilled step, so this is the only way back to the steps
        // above it — e.g. out of a university that turned out to have no faculties in the catalog.
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate('SetupRegion')} style={styles.link}>
          <Text style={styles.linkText}>{hasGroup ? 'Изменить университет или группу' : 'Изменить университет'}</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

/** «2026-09-01» → «1 сентября 2026». */
function formatIsoDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  return `${formatDayDate(new Date(year, month - 1, day))} ${year}`;
}

interface DayCardProps {
  lectures?: LectureDto[];
  loading: boolean;
  newcomerKind: ReturnType<typeof useNewcomer>['kind'];
  now: Date;
  onOpenLecture: (lecture: LectureDto) => void;
  onOpenSchedule: () => void;
  onFirstPair: () => void;
}

/**
 * The navy card at the top of a complete profile: the nearest lecture, or what stands between the
 * student and one — the first pair (a newcomer, PLAN.md M24), an administrator (an agreed schedule
 * without pairs) or nothing ahead at all (the semester is over).
 */
function DayCard({ lectures, loading, newcomerKind, now, onOpenLecture, onOpenSchedule, onFirstPair }: DayCardProps) {
  const c = useLibraryColors();
  const styles = useStyles();
  const { nearest, next } = upcomingLectures(lectures ?? [], now);

  let body: React.ReactNode;
  if (loading) {
    body = <ActivityIndicator color={c.cream} style={styles.dayLoading} />;
  } else if (nearest) {
    const start = new Date(nearest.scheduledTime);
    body = (
      <>
        <Text style={styles.cardEyebrow}>БЛИЖАЙШЕЕ ЗАНЯТИЕ · {lectureDayLabel(nearest, now)}</Text>
        <Text style={styles.dayTime}>
          {formatTime(start)} – {formatTime(lectureEnd(nearest))}
        </Text>
        <Text style={styles.daySubject}>{nearest.title}</Text>
        {nearest.room ? <Text style={styles.cardMuted}>ауд. {nearest.room}</Text> : null}
        {next ? (
          <>
            <View style={styles.cardRule} />
            <Text style={styles.cardMuted}>
              Дальше: {shortDayName(new Date(next.scheduledTime))}, {formatDayDate(new Date(next.scheduledTime))} —{' '}
              {next.title}, {formatTime(new Date(next.scheduledTime))}
            </Text>
          </>
        ) : null}
        <CardOutlineButton label="Открыть расписание" onPress={() => onOpenLecture(nearest)} />
      </>
    );
  } else if (newcomerKind === 'newcomer') {
    body = (
      <>
        <Text style={styles.cardEyebrow}>ДО РАСПИСАНИЯ</Text>
        <Text style={styles.cardTitle}>Остался последний шаг</Text>
        <Text style={styles.cardMuted}>Добавьте первую пару в расписание группы — занятия появятся на весь семестр.</Text>
        <CardOutlineButton label="Добавить первую пару" onPress={onFirstPair} />
      </>
    );
  } else if (newcomerKind === 'closed') {
    body = (
      <>
        <Text style={styles.cardEyebrow}>РАСПИСАНИЕ</Text>
        <Text style={styles.cardTitle}>Пока пусто</Text>
        <Text style={styles.cardMuted}>Расписание группы не заполнено и уже согласовано — обратитесь к администратору.</Text>
      </>
    );
  } else {
    body = (
      <>
        <Text style={styles.cardEyebrow}>БЛИЖАЙШЕЕ ЗАНЯТИЕ</Text>
        <Text style={styles.cardTitle}>Ближайших занятий нет</Text>
        <Text style={styles.cardMuted}>В расписании впереди ничего нет — возможно, семестр закончился.</Text>
        <CardOutlineButton label="Открыть расписание" onPress={onOpenSchedule} />
      </>
    );
  }

  return <View style={[styles.card, { backgroundColor: c.dayCard }]}>{body}</View>;
}

interface SetupCardProps {
  steps: ReturnType<typeof setupSteps>;
  requestText?: string;
  requestComment?: string;
  /** «Продолжить настройку» wrapped in the newcomer's first hint. */
  hint: React.ReactNode;
}

/** The terracotta card of an unfinished profile: what is left before the schedule (issue #65). */
function SetupCard({ steps, requestText, requestComment, hint }: SetupCardProps) {
  const c = useLibraryColors();
  const styles = useStyles();
  const left = steps.filter((step) => !step.done).length;
  return (
    <View style={[styles.card, { backgroundColor: c.setupCard }]}>
      <Text style={styles.cardEyebrow}>ДО РАСПИСАНИЯ</Text>
      <Text style={styles.cardTitle}>{stepsLeftTitle(left)}</Text>
      <View style={styles.steps}>
        {steps.map((step) => (
          <Text
            key={step.title}
            style={[styles.step, step.current && styles.stepCurrent, !step.done && !step.current && styles.stepLater]}
          >
            {step.done ? '✓' : '○'}
            {'  '}
            {step.title}
          </Text>
        ))}
      </View>
      {requestText ? <Text style={styles.cardMuted}>{requestText}</Text> : null}
      {requestComment ? <Text style={styles.cardMuted}>{requestComment}</Text> : null}
      {hint}
    </View>
  );
}

function CardOutlineButton({ label, onPress }: { label: string; onPress: () => void }) {
  const styles = useStyles();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.cardOutline}>
      <Text style={styles.cardOutlineLabel}>{label}</Text>
    </Pressable>
  );
}

interface FieldProps {
  label: string;
  value: string;
  detail?: string;
  onRename?: () => void;
  renameLabel?: string;
  last?: boolean;
}

function Field({ label, value, detail, onRename, renameLabel, last }: FieldProps) {
  const c = useLibraryColors();
  const styles = useStyles();
  return (
    <View style={[styles.field, !last && styles.fieldDivider]}>
      <View style={styles.fieldText}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
        {detail ? <Text style={styles.fieldDetail}>{detail}</Text> : null}
      </View>
      {onRename ? (
        <IconButton
          icon="pencil-outline"
          accessibilityLabel={renameLabel}
          iconColor={c.terracotta}
          size={20}
          onPress={onRename}
          style={styles.rename}
        />
      ) : null}
    </View>
  );
}

const useStyles = libraryStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    backgroundColor: c.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  greeting: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 14,
    color: c.inkMuted,
  },
  name: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 30,
    color: c.ink,
  },
  settings: {
    margin: 0,
    borderColor: c.border,
  },
  card: {
    borderRadius: 18,
    padding: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 4,
  },
  cardEyebrow: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 10.5,
    letterSpacing: 1.6,
    color: libraryHintColors.accent,
  },
  cardTitle: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 28,
    lineHeight: 36,
    color: c.cream,
  },
  cardMuted: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(250, 244, 238, 0.8)',
  },
  cardRule: {
    height: 1,
    backgroundColor: 'rgba(250, 244, 238, 0.22)',
    marginTop: 8,
    marginBottom: 4,
  },
  dayLoading: {
    paddingVertical: 48,
  },
  dayTime: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 34,
    lineHeight: 42,
    color: c.cream,
  },
  daySubject: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 21,
    color: c.cream,
  },
  cardOutline: {
    marginTop: 12,
    height: 48,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(250, 244, 238, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardOutlineLabel: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 15,
    color: c.cream,
  },
  cardButton: {
    marginTop: 8,
    borderRadius: 6,
  },
  cardButtonContent: {
    height: 52,
  },
  cardButtonLabel: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 16,
  },
  steps: {
    gap: 8,
    marginVertical: 6,
  },
  step: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 15,
    color: c.cream,
  },
  stepCurrent: {
    fontFamily: libraryFonts.bodyBold,
  },
  stepLater: {
    color: 'rgba(250, 244, 238, 0.7)',
  },
  ticket: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  ticketSpine: {
    flexDirection: 'row',
    height: 5,
  },
  ticketSpineSegment: {
    flex: 1,
  },
  ticketBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.spines[0],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 16,
    color: c.cream,
  },
  ticketText: {
    flex: 1,
    gap: 2,
  },
  ticketName: {
    fontFamily: libraryFonts.headingBold,
    fontSize: 16,
    color: c.ink,
  },
  ticketLine: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 12.5,
    color: c.inkMuted,
  },
  ticketMark: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 9.5,
    letterSpacing: 1.2,
    color: c.terracotta,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  fieldDivider: {
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  fieldText: {
    flex: 1,
    gap: 2,
  },
  fieldLabel: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 12,
    color: c.inkMuted,
  },
  fieldValue: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 15,
    color: c.ink,
  },
  fieldDetail: {
    fontFamily: libraryFonts.bodyRegular,
    fontSize: 13,
    color: c.inkMuted,
  },
  rename: {
    margin: 0,
  },
  link: {
    paddingVertical: 10,
    paddingHorizontal: 2,
    alignSelf: 'flex-start',
  },
  linkText: {
    fontFamily: libraryFonts.bodyBold,
    fontSize: 14.5,
    color: c.terracotta,
  },
}));
