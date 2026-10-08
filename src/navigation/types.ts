import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
  RegisterRoleChoice: undefined;
  /** Step 1 of student registration (PLAN.md) — creates the account; steps 2–6 are `Setup*` below. */
  RegisterStudent: undefined;
  RegisterTeacher: undefined;
};

/**
 * `Home` currently hosts the role-specific profile screen (`features/profile/ProfileScreen`,
 * ROADMAP.md "Фаза 2"). The real tab/stack structure (Profile/Schedule/Courses/...) is built in
 * Фаза 3+.
 */
export type AppStackParamList = {
  Home: undefined;
};

/** Bottom tabs for the student experience (ROADMAP.md "Фаза 3"/"Фаза 4"). */
export type StudentTabParamList = {
  Profile: undefined;
  Schedule: undefined;
  Courses: undefined;
};

/**
 * Native stack wrapping `StudentTabParamList` so tapping into a lecture or a course (ROADMAP.md
 * "Фаза 4") pushes a details screen over the tab bar instead of replacing the tabs.
 */
export type StudentStackParamList = {
  Tabs: NavigatorScreenParams<StudentTabParamList> | undefined;
  LectureDetails: { lectureId: string };
  CourseDetails: { courseId: string };
  /**
   * Steps 2–6 of student registration (PLAN.md), done under the new account's token: each choice
   * is saved with `PATCH /students/me`, so the wizard can be left and resumed at any step.
   */
  SetupRegion: undefined;
  /** No `regionId` means a country-wide search (region not in the list, or failed to load). */
  SetupUniversity: { regionId?: string; regionName?: string } | undefined;
  SetupFaculty: undefined;
  SetupYear: undefined;
  SetupGroup: undefined;
  /** Final screen of the wizard — says how far the profile got and what is still missing. */
  SetupDone: undefined;
  /** «Расписание группы» — заполнение `Pair` и генерация `Lecture` (`UI_UX.md` раздел 4). */
  GroupSchedule: undefined;
  /** Add-`Pair` when `pairId` is omitted, edit that `Pair` otherwise. */
  PairForm: { pairId?: string } | undefined;
};

/** Screen props for a tab screen that also needs to navigate into the parent `StudentStack`. */
export type StudentTabScreenProps<T extends keyof StudentTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<StudentTabParamList, T>,
  NativeStackScreenProps<StudentStackParamList>
>;

export type StudentStackScreenProps<T extends keyof StudentStackParamList> = NativeStackScreenProps<
  StudentStackParamList,
  T
>;

/** Bottom tabs for the teacher experience (ROADMAP.md "Фаза 6"). */
export type TeacherTabParamList = {
  Profile: undefined;
  Courses: undefined;
  Lectures: undefined;
};

/** Native stack wrapping `TeacherTabParamList`, same reasoning as `StudentStackParamList` above. */
export type TeacherStackParamList = {
  Tabs: undefined;
  LectureDetails: { lectureId: string };
  /** Manual `POST /lectures` (no source `Pair`). */
  LectureForm: undefined;
  /** `POST /lectures/generate` for one `Pair` template — pick a date. */
  GenerateLecture: { pairId: string };
};

export type TeacherTabScreenProps<T extends keyof TeacherTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TeacherTabParamList, T>,
  NativeStackScreenProps<TeacherStackParamList>
>;

export type TeacherStackScreenProps<T extends keyof TeacherStackParamList> = NativeStackScreenProps<
  TeacherStackParamList,
  T
>;
