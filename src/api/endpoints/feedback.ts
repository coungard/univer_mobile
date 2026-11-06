import { apiClient } from '../client';
import { FeedbackDto, SubmitFeedbackRequest } from '../types';

/**
 * `POST /feedback` — any role (issue #82, backend coungard/univer#130). Limited to one per hour per
 * user: the next one gets `429` with `retryAfterSeconds` (see `ApiError`).
 */
export async function submitFeedback(request: SubmitFeedbackRequest): Promise<FeedbackDto> {
  const { data } = await apiClient.post<FeedbackDto>('/feedback', request);
  return data;
}
