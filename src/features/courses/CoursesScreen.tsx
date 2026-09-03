import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CourseDto } from '../../api/types';
import { EmptyState } from '../../components/EmptyState';
import { StudentTabScreenProps } from '../../navigation/types';
import { useGroupAcademicPathQuery, useOwnStudentQuery } from '../profile/hooks';
import { useCoursesQuery } from './hooks';

type Props = StudentTabScreenProps<'Courses'>;

/**
 * Таб «Курсы» (ROADMAP.md "Фаза 4"): полный каталог курсов (`GET /courses`) с опциональным
 * фильтром по кафедре (`GET /courses/department/{id}`) — кафедры берутся из факультета студента
 * (уже резолвится для профиля, `useGroupAcademicPathQuery`), так что фильтр появляется только у
 * студента с назначенной группой. Карточка ведёт в `CourseDetailsScreen` за один тап.
 */
export function CoursesScreen({ navigation }: Props) {
  const student = useOwnStudentQuery();
  const academicPath = useGroupAcademicPathQuery(student.data?.groupId);
  const departments = academicPath.faculty?.departments ?? [];

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const courses = useCoursesQuery(selectedDepartmentId);

  const courseList = useMemo(() => courses.data ?? [], [courses.data]);

  // This tab's `Tab.Navigator` renders with `headerShown: false`, so nothing else accounts for the
  // status bar — without this, the department filter row (the topmost, and only tappable-at-the-very-
  // top, content on this screen) renders partly underneath it, where taps land on the system status
  // bar instead of the app (confirmed on-device, not just a visual overlap).
  const insets = useSafeAreaInsets();

  if (courses.isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text>Загрузка курсов…</Text>
      </View>
    );
  }

  if (courses.isError) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <EmptyState title="Не удалось загрузить курсы" description="Проверьте подключение к сети." />
        <Button mode="outlined" onPress={() => courses.refetch()}>
          Повторить
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {departments.length > 0 ? (
        <FlatList
          horizontal
          data={departments}
          keyExtractor={(d) => d.id as string}
          extraData={selectedDepartmentId}
          contentContainerStyle={styles.filterRow}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const departmentId = item.id as string;
            return (
              <Chip
                selected={selectedDepartmentId === departmentId}
                onPress={() => setSelectedDepartmentId((prev) => (prev === departmentId ? null : departmentId))}
                style={styles.chip}
              >
                {item.name}
              </Chip>
            );
          }}
          ListHeaderComponent={
            <Chip selected={selectedDepartmentId === null} onPress={() => setSelectedDepartmentId(null)} style={styles.chip}>
              Все
            </Chip>
          }
        />
      ) : null}

      <FlatList
        data={courseList}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={courses.isRefetching} onRefresh={() => courses.refetch()} />}
        ListEmptyComponent={<EmptyState title="Курсов пока нет" description="Список пуст для выбранного фильтра." />}
        renderItem={({ item }: { item: CourseDto }) => (
          <Card style={styles.card} onPress={() => navigation.navigate('CourseDetails', { courseId: item.id })}>
            <Card.Content>
              <Text variant="titleMedium">{item.title}</Text>
              {item.description ? (
                <Text variant="bodyMedium" style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  chip: {
    marginRight: 8,
  },
  list: {
    padding: 16,
    gap: 12,
    flexGrow: 1,
  },
  card: {
    marginBottom: 12,
  },
  description: {
    marginTop: 4,
    opacity: 0.7,
  },
});
