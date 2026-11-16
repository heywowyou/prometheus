import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@lib/query/keys";
import { getErrorMessage } from "@lib/api/errors";
import { useCalendarApi } from "../api/calendar-api";
import type { CalendarOccurrence, EventPayload } from "../types/calendar-types";

/** Occurrences between two days (inclusive). Keeps the last range up while the next loads. */
export const useEvents = (from: string, to: string) => {
  const api = useCalendarApi();
  const query = useQuery({
    queryKey: queryKeys.calendar.range(from, to),
    queryFn: () => api.fetchEvents(from, to),
    placeholderData: keepPreviousData,
  });
  return { events: query.data ?? [], loading: query.isPending };
};

type Patch = { occurrence: CalendarOccurrence; payload: EventPayload };

/** Event mutations. Moves and resizes show at once on every cached range. */
export const useEventActions = () => {
  const queryClient = useQueryClient();
  const api = useCalendarApi();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
  const onError = (error: unknown) => {
    toast.error(getErrorMessage(error));
    refresh();
  };

  const create = useMutation({ mutationFn: api.createEvent, onSuccess: refresh, onError });

  const update = useMutation({
    mutationFn: ({ occurrence, payload }: Patch) =>
      api.updateEvent(occurrence.eventId, { ...payload, occurrenceDay: occurrence.occurrenceDay }),
    onMutate: ({ occurrence, payload }) => {
      // Only the occurrence on screen moves now; a series settles on refetch.
      queryClient.setQueriesData<CalendarOccurrence[]>({ queryKey: ["calendar", "range"] }, (previous) =>
        previous?.map((item) => (item._id === occurrence._id ? { ...item, ...payload } as CalendarOccurrence : item)),
      );
    },
    onSuccess: refresh,
    onError,
  });

  const remove = useMutation({
    mutationFn: ({ occurrence, onlyThis }: { occurrence: CalendarOccurrence; onlyThis: boolean }) =>
      api.deleteEvent(occurrence.eventId, onlyThis ? occurrence.occurrenceDay : undefined),
    onMutate: ({ occurrence, onlyThis }) => {
      queryClient.setQueriesData<CalendarOccurrence[]>({ queryKey: ["calendar", "range"] }, (previous) =>
        previous?.filter((item) => (onlyThis ? item._id !== occurrence._id : item.eventId !== occurrence.eventId)),
      );
    },
    onSuccess: refresh,
    onError,
  });

  return {
    createEvent: (payload: EventPayload) => create.mutateAsync(payload),
    updateEvent: (occurrence: CalendarOccurrence, payload: EventPayload) => update.mutateAsync({ occurrence, payload }),
    deleteEvent: (occurrence: CalendarOccurrence, onlyThis: boolean) => remove.mutate({ occurrence, onlyThis }),
  };
};
