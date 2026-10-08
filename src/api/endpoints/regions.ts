import { apiClient } from '../client';
import { RegionDto } from '../types';

/**
 * `GET /regions` — public, unpaginated list of all 89 subjects of the Russian Federation, sorted
 * by name. Used by the "select region" step of student registration (PLAN.md, step 2).
 */
export async function getRegions(): Promise<RegionDto[]> {
  const { data } = await apiClient.get<RegionDto[]>('/regions');
  return data;
}
