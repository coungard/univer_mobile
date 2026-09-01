import { apiClient } from '../client';
import { RegisterStudentRequest, StudentDto } from '../types';

/**
 * `POST /students/register` — the only public (no JWT) student-creation endpoint. Creates the
 * Keycloak user + assigns the `STUDENT` role + creates the local `Student` row in one call.
 * `groupId` is intentionally absent from the request — see ROADMAP.md "Фаза 2".
 */
export async function registerStudent(request: RegisterStudentRequest): Promise<StudentDto> {
  const { data } = await apiClient.post<StudentDto>('/students/register', request);
  return data;
}

/**
 * `GET /students/{id}` — requires the `STUDENT` role on the caller, but per API.md the endpoint
 * doesn't check that `id` matches the caller's own `sub`. Used here only for a student to fetch
 * their own profile (`id` = Keycloak `sub`, see ROADMAP.md "Фаза 2").
 */
export async function getStudent(id: string): Promise<StudentDto> {
  const { data } = await apiClient.get<StudentDto>(`/students/${id}`);
  return data;
}
