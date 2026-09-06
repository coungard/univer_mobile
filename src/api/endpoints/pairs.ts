import { apiClient } from '../client';
import { Page, PairDto, PairInput } from '../types';

/**
 * `GET /pairs` — the full, unfiltered `Pair` list; no "pairs by teacher" endpoint exists, so a
 * teacher's own templates (ROADMAP.md "Фаза 6") are found by filtering this client-side on
 * `PairDto.teacherId` (see `features/teacher/hooks.ts`) — the same "fetch a large-enough page, filter
 * in JS" approach as `getMyLectures`/`getCourses`.
 */
export async function getPairs(page = 0, size = 200): Promise<Page<PairDto>> {
  const { data } = await apiClient.get<Page<PairDto>>('/pairs', { params: { page, size } });
  return data;
}

/** `GET /pairs/group/{groupId}` — a group's recurring class templates (its "Расписание группы"). */
export async function getPairsByGroup(groupId: string, page = 0, size = 50): Promise<Page<PairDto>> {
  const { data } = await apiClient.get<Page<PairDto>>(`/pairs/group/${groupId}`, { params: { page, size } });
  return data;
}

/** `GET /pairs/{id}` — used to load a `Pair` into the edit form by id rather than trusting list cache. */
export async function getPair(id: string): Promise<PairDto> {
  const { data } = await apiClient.get<PairDto>(`/pairs/${id}`);
  return data;
}

/**
 * `POST /pairs` — `ADMIN` or `STUDENT` (own group only, cycle must be `DRAFT` — enforced server-side,
 * see API.md). `422` on a teacher/room conflict with an existing `Pair` of the same cycle.
 */
export async function createPair(pair: PairInput): Promise<PairDto> {
  const { data } = await apiClient.post<PairDto>('/pairs', pair);
  return data;
}

/** `PUT /pairs/{id}` — same `ADMIN`/`STUDENT` scope as `createPair`. */
export async function updatePair(id: string, pair: PairInput): Promise<PairDto> {
  const { data } = await apiClient.put<PairDto>(`/pairs/${id}`, pair);
  return data;
}

/** `DELETE /pairs/{id}` — same `ADMIN`/`STUDENT` scope as `createPair`. */
export async function deletePair(id: string): Promise<void> {
  await apiClient.delete(`/pairs/${id}`);
}
