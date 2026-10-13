import { apiClient } from '../client';
import { CourseDto, Page } from '../types';

/**
 * `GET /courses` — full course catalogue, any authenticated role (ROADMAP.md "Фаза 4"). Курс
 * "просмотр зачисленных" для студента специально не фильтруется здесь — на бэкенде нет эндпоинта
 * "мои курсы", только общий список и зачисления (`EnrollmentDto`, ROADMAP.md "Фаза 5"/"Фаза 7").
 */
export async function getCourses(page = 0, size = 100): Promise<Page<CourseDto>> {
  const { data } = await apiClient.get<Page<CourseDto>>('/courses', { params: { page, size } });
  return data;
}

/**
 * `GET /courses?facultyId=` — the subjects of one faculty, sorted by title: those attached to it
 * directly (the ones students created included) and through its departments (univer#97). Subjects
 * with neither a faculty nor a department are not in it. An empty page when there are none.
 */
export async function getCoursesByFaculty(facultyId: string, page = 0, size = 100): Promise<Page<CourseDto>> {
  const { data } = await apiClient.get<Page<CourseDto>>('/courses', { params: { facultyId, page, size } });
  return data;
}

/** `GET /courses/{id}` — course details screen. */
export async function getCourse(id: string): Promise<CourseDto> {
  const { data } = await apiClient.get<CourseDto>(`/courses/${id}`);
  return data;
}
