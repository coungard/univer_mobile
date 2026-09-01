import { apiClient } from '../client';
import { StudyYearDto } from '../types';

/** `GET /study-years/{id}`. */
export async function getStudyYear(id: string): Promise<StudyYearDto> {
  const { data } = await apiClient.get<StudyYearDto>(`/study-years/${id}`);
  return data;
}
