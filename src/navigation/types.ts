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
