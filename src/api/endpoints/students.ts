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
