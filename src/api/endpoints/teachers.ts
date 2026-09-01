import { apiClient } from '../client';
import { RegisterTeacherRequest, TeacherDto } from '../types';

/**
 * `POST /teachers/register` — the only public (no JWT) teacher-creation endpoint that goes
 * through Keycloak. Do NOT use `POST /teachers/` for registration: per API.md it isn't wired to
 * Keycloak at all, so the resulting `id` wouldn't match any Keycloak user id.
 */
export async function registerTeacher(request: RegisterTeacherRequest): Promise<TeacherDto> {
  const { data } = await apiClient.post<TeacherDto>('/teachers/register', request);
  return data;
}

/** `GET /teachers/{id}` — any authenticated role; used for a teacher to fetch their own profile. */
export async function getTeacher(id: string): Promise<TeacherDto> {
  const { data } = await apiClient.get<TeacherDto>(`/teachers/${id}`);
  return data;
}
