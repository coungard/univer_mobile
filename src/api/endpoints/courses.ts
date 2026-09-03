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

/** `GET /courses/department/{departmentId}` — used to filter the course list by department. */
export async function getCoursesByDepartment(
  departmentId: string,
  page = 0,
  size = 100,
): Promise<Page<CourseDto>> {
  const { data } = await apiClient.get<Page<CourseDto>>(`/courses/department/${departmentId}`, {
    params: { page, size },
  });
  return data;
}

/** `GET /courses/{id}` — course details screen. */
export async function getCourse(id: string): Promise<CourseDto> {
  const { data } = await apiClient.get<CourseDto>(`/courses/${id}`);
  return data;
}
