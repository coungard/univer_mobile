export type AuthStackParamList = {
  Login: undefined;
  RegisterRoleChoice: undefined;
  RegisterStudent: undefined;
  RegisterTeacher: undefined;
};

/**
 * Placeholder — the real tab/stack structure (Profile/Schedule/Courses/...) is built in
 * ROADMAP.md's Фаза 3+. For now this just proves the post-login state and hosts the Logout
 * button (Фаза 1, issue "Логаут").
 */
export type AppStackParamList = {
  Home: undefined;
};
