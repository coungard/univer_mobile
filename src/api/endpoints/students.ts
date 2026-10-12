import { apiClient } from '../client';
import { ApiError } from '../errors';
import {
  CreateStudentFacultyRequest,
  CreateStudentGroupRequest,
  RegisterStudentRequest,
  StudentDto,
  SubmitUniversityRequest,
  UniversityRequestDto,
  UpdateStudentProfileRequest,
} from '../types';

/**
 * `POST /students/register` — the only public (no JWT) student-creation endpoint. Creates the
 * Keycloak user + assigns the `STUDENT` role + creates the local `Student` row in one call.
 * `universityId` is optional: the account is created first, and the student then fills in
 * university → faculty → year → group through `updateOwnStudent` (PLAN.md).
 */
export async function registerStudent(request: RegisterStudentRequest): Promise<StudentDto> {
  const { data } = await apiClient.post<StudentDto>('/students/register', request);
  return data;
}

/** `GET /students/me` — the calling student's own profile, resolved from the JWT's `sub`. */
export async function getOwnStudent(): Promise<StudentDto> {
  const { data } = await apiClient.get<StudentDto>('/students/me');
  return data;
}

/**
 * `PATCH /students/me` — the student fills in their own university → faculty → year → group.
 * Changing a field clears everything below it in that chain on the server (see API.md).
 */
export async function updateOwnStudent(request: UpdateStudentProfileRequest): Promise<StudentDto> {
  const { data } = await apiClient.patch<StudentDto>('/students/me', request);
  return data;
}

/**
 * `POST /students/me/faculty` — the student creates a faculty missing from the list of their
 * university; it is saved in the profile right away, year and group are reset. A name already
 * taken in that university is a `409` carrying the existing faculty's ID (see API.md).
 */
export async function createOwnFaculty(request: CreateStudentFacultyRequest): Promise<StudentDto> {
  const { data } = await apiClient.post<StudentDto>('/students/me/faculty', request);
  return data;
}

/**
 * `POST /students/me/group` — the student creates a group missing from the list of their faculty
 * and year and joins it right away; the response is the profile with the new `groupId`. A name
 * already taken on that year is a `409` carrying the existing group's ID (see API.md).
 */
export async function createOwnGroup(request: CreateStudentGroupRequest): Promise<StudentDto> {
  const { data } = await apiClient.post<StudentDto>('/students/me/group', request);
  return data;
}

/**
 * `GET /students/me/university-request` — the student's latest request to add a university: the
 * pending one, or else the last closed or rejected one. `null` when the student never left a
 * request (the server answers `404`, which is not an error here).
 */
export async function getOwnUniversityRequest(): Promise<UniversityRequestDto | null> {
  try {
    const { data } = await apiClient.get<UniversityRequestDto>('/students/me/university-request');
    return data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

/**
 * `PUT /students/me/university-request` — leaves a request, or updates the pending one (there is
 * never more than one). A `422` means the profile already has a university (see API.md).
 */
export async function submitOwnUniversityRequest(request: SubmitUniversityRequest): Promise<UniversityRequestDto> {
  const { data } = await apiClient.put<UniversityRequestDto>('/students/me/university-request', request);
  return data;
}
