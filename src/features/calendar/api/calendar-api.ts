import { useCallback, useMemo } from "react";
import { useApiClient } from "@lib/api/api-client";
import type { CalendarOccurrence, EventPayload } from "../types/calendar-types";

const PATH = "/calendar/events";

export const useCalendarApi = () => {
  const client = useApiClient();

  /** Occurrences between two days, inclusive. */
  const fetchEvents = useCallback(
    async (from: string, to: string): Promise<CalendarOccurrence[]> => {
      const { data } = await client.get<CalendarOccurrence[]>(PATH, { params: { from, to } });
      return data;
    },
    [client],
  );

  const createEvent = useCallback(
    async (payload: EventPayload): Promise<CalendarOccurrence | null> => {
      const { data } = await client.post<CalendarOccurrence | null>(PATH, payload);
      return data;
    },
    [client],
  );

  /** Updates the whole event; `occurrenceDay` says which occurrence was moved. */
  const updateEvent = useCallback(
    async (id: string, payload: EventPayload & { occurrenceDay?: string }): Promise<void> => {
      await client.patch(`${PATH}/${id}`, payload);
    },
    [client],
  );

  /** Deletes the event, or only one occurrence of a repeating event. */
  const deleteEvent = useCallback(
    async (id: string, occurrence?: string): Promise<void> => {
      await client.delete(`${PATH}/${id}`, { params: occurrence ? { occurrence } : undefined });
    },
    [client],
  );

  return useMemo(
    () => ({ fetchEvents, createEvent, updateEvent, deleteEvent }),
    [fetchEvents, createEvent, updateEvent, deleteEvent],
  );
};
