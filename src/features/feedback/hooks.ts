import { useMutation } from '@tanstack/react-query';
import { submitFeedback } from '../../api/endpoints/feedback';

/** `POST /feedback` (issue #82). Nothing to invalidate: the app never reads feedback back. */
export function useSubmitFeedbackMutation() {
  return useMutation({ mutationFn: submitFeedback });
}
