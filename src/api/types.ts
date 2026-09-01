/**
 * DTOs sourced from the backend's live OpenAPI spec (`http://localhost:8023/v3/api-docs`), via
 * `npm run sync-api` -> `src/api/generated/schema.ts` (openapi-typescript). Re-run that script and
 * commit the regenerated file whenever the backend's contract changes — that keeps this file from
 * silently drifting from the real API, which hand-written DTOs could not guarantee.
 *
 * `components['schemas']['XDto']` doubles as both the request and response shape on the backend
 * (see API.md), so springdoc marks server-assigned fields like `id` as optional even though every
 * response we actually consume has them set. `WithRequiredId` narrows just that back down for the
 * response-shaped aliases below, since this app only ever reads these DTOs from GET/list responses.
 */

import { components } from './generated/schema';

type WithRequiredId<T extends { id?: string }> = Omit<T, 'id'> & { id: string };

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export type AddressDto = components['schemas']['AddressDto'];
export type FacultyDto = components['schemas']['FacultyDto'];
export type UniversityDto = WithRequiredId<components['schemas']['UniversityDto']>;
export type DepartmentDto = WithRequiredId<components['schemas']['DepartmentDto']>;

export type StudentDto = WithRequiredId<components['schemas']['StudentDto']> & {
  /**
   * The generated type says `groupId?: string` (present/absent), but the backend actually sends
   * `groupId: null` in the response body until an admin assigns one (`StudentDto` isn't annotated
   * `@JsonInclude(NON_NULL)` — see API.md) — springdoc's schema doesn't capture that distinction.
   * `!student.groupId` works correctly either way, but this makes the real shape explicit.
   * See ROADMAP.md "Фаза 2".
   */
  groupId?: string | null;
};

export type RegisterStudentRequest = components['schemas']['RegisterStudentRequest'];

export type TeacherDto = WithRequiredId<components['schemas']['TeacherDto']>;
export type RegisterTeacherRequest = components['schemas']['RegisterTeacherRequest'];

/**
 * Academic-path chain used to resolve a student's group → faculty/program for display (ROADMAP.md
 * "Фаза 2"). `GroupDto` only carries `semesterId` — there is no direct link to program/faculty, so
 * showing them means walking group → semester → study year → program → faculty one hop at a time
 * (see `features/profile/hooks.ts`).
 */
export type GroupDto = WithRequiredId<components['schemas']['GroupDto']>;
export type SemesterDto = WithRequiredId<components['schemas']['SemesterDto']>;
export type StudyYearDto = WithRequiredId<components['schemas']['StudyYearDto']>;
export type ProgramDto = WithRequiredId<components['schemas']['ProgramDto']>;

/**
 * A concrete, dated occurrence of a class (as opposed to `PairDto`, its recurring template) —
 * `GET /lectures/me` (ROADMAP.md "Фаза 3"). `scheduledTime` is a full date-time, not just a
 * time-of-day, so a week's lectures are found by filtering on it client-side (the endpoint has no
 * date-range params — see API.md).
 */
export type LectureDto = WithRequiredId<components['schemas']['LectureDto']>;
