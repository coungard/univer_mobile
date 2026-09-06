import { Page } from './types';

/**
 * Fetches every page of a `Page<T>` endpoint and flattens them into one array. Needed wherever the
 * app builds a complete list to filter or join client-side by identity — a teacher's own
 * courses/pairs (`CourseDto.teacherId`/`PairDto.teacherId`, no matching filter endpoint exists), a
 * lecture's attendance roster, a student's full lecture/attendance history (ROADMAP.md "Фаза 8").
 * Fetching just the first "reasonably large" page there isn't an incomplete *display* the user could
 * shrug off — it silently drops real matches once a dataset outgrows one page (a course roster past
 * a couple hundred students, a lecture history past a couple of semesters), which is a correctness
 * bug, not a UX nicety. Screens that genuinely just browse a growing list (`CoursesScreen`'s catalog)
 * use real infinite-scroll pagination instead — see `features/courses/hooks.ts`.
 */
export async function fetchAllPages<T>(fetchPage: (page: number) => Promise<Page<T>>): Promise<T[]> {
  const items: T[] = [];
  let page = 0;
  // Loop guard: `last`/`content` should always end the loop, but a backend that never sets `last`
  // must not spin forever.
  for (let guard = 0; guard < 1000; guard++) {
    const result = await fetchPage(page);
    items.push(...result.content);
    if (result.last || result.content.length === 0) break;
    page += 1;
  }
  return items;
}
