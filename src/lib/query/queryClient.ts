import { QueryClient, MutationCache, QueryCache } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage, toApiError } from "@lib/api/errors";

/**
 * Builds the app's QueryClient.
 *
 * Errors are surfaced as toasts from one place rather than per-callsite, which
 * is what the hand-rolled hooks were missing: every failure used to end as a
 * `console.error` the user never saw.
 */
export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          const { status } = toApiError(error);
          // Client errors won't fix themselves on a retry.
          if (status && status >= 400 && status < 500) return false;
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Background refetches of already-rendered data shouldn't nag, and a
        // query can opt out when it reports its own errors inline.
        if (query.state.data !== undefined) return;
        if (query.meta?.silentErrors) return;
        toast.error(getErrorMessage(error));
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) => {
        // A mutation with its own onError has opted out of the default toast.
        if (mutation.options.onError) return;
        toast.error(getErrorMessage(error));
      },
    }),
  });
