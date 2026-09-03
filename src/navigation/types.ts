import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
  RegisterRoleChoice: undefined;
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
  Tabs: undefined;
  LectureDetails: { lectureId: string };
  CourseDetails: { courseId: string };
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
