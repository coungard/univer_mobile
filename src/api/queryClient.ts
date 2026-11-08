import { QueryClient } from '@tanstack/react-query';

/**
 * The app's one TanStack Query cache. Lives outside `App.tsx` so the session code can drop it when
 * the user signs out or deletes the account: the next user of the device mustn't see the old
 * profile, even for a moment.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});
