import { apiClient } from '../client';
import { SemesterDto, SemesterWeekDto } from '../types';

/** `GET /semesters/{id}`. */
export async function getSemester(id: string): Promise<SemesterDto> {
  const { data } = await apiClient.get<SemesterDto>(`/semesters/${id}`);
  return data;
}

/**
 * `GET /semesters/{id}/week?date=` — the number and parity of the calendar week (Mon–Sun) holding `date`
 * (`"2026-10-13"`), by the rule the server makes lectures with (univer#107). A week outside the semester is
 * `inSemester: false` with no number.
 */
export async function getSemesterWeek(id: string, date: string): Promise<SemesterWeekDto> {
  const { data } = await apiClient.get<SemesterWeekDto>(`/semesters/${id}/week`, { params: { date } });
  return data;
}
