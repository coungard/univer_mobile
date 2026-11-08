import { useMutation } from '@tanstack/react-query';
import { deleteAccount } from '../../api/endpoints/account';
import { finishAccountDeletion } from '../../auth/sessionManager';

/**
 * `DELETE /users/me` (issue #86), then signing out on the device. The query cache is cleared there,
 * so there's nothing to invalidate.
 */
export function useDeleteAccountMutation() {
  return useMutation({
    mutationFn: async () => {
      await deleteAccount();
      await finishAccountDeletion();
    },
  });
}
