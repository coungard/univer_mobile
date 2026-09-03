import { apiClient } from '../client';
import { Page, PairDto, PairInput } from '../types';

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
