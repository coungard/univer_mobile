import React from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { describeError } from '../../api/errors';
import { CourseDto } from '../../api/types';
import { EmptyState } from '../../components/EmptyState';
import { TeacherTabScreenProps } from '../../navigation/types';
import { useOwnCoursesQuery } from '../courses/hooks';

type Props = TeacherTabScreenProps<'Courses'>;

/**
 * Таб «Мои курсы» (ROADMAP.md "Фаза 6"): курсы, где `CourseDto.teacherId` — сам преподаватель. Просто
 * список — управление курсом (создание/редактирование) вне скоупа этой фазы, только просмотр перед
 * тем как перейти к «Мои лекции».
 */
export function TeacherCoursesScreen({}: Props) {
  const courses = useOwnCoursesQuery();
  const insets = useSafeAreaInsets();
  const error = courses.isError ? describeError(courses.error) : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={courses.data}
        keyExtractor={(c: CourseDto) => c.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={courses.isRefetching} onRefresh={() => courses.refetch()} />}
        ListEmptyComponent={
          courses.isLoading ? (
            <Text style={styles.center}>Загрузка курсов…</Text>
          ) : error ? (
            <EmptyState title={error.title} description={error.message} />
          ) : (
            <EmptyState
              title="Курсов пока нет"
              description="Курсы, где вы указаны преподавателем, появятся здесь."
            />
          )
        }
        renderItem={({ item }: { item: CourseDto }) => (
          <Card style={styles.card}>
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
    textAlign: 'center',
    marginTop: 24,
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
