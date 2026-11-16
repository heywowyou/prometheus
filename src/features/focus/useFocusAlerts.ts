import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useApiClient } from "@lib/api/api-client";
import { PHASE_LABELS, onFocusFinish, useFocusState, type FocusPhase } from "./focus-store";
import { playChime } from "./chime";

const MESSAGES: Record<FocusPhase, { title: string; body: string }> = {
  focus: { title: "Focus block done", body: "Time for a break." },
  short: { title: "Break's over", body: "Ready for another focus block?" },
  long: { title: "Long break's over", body: "Ready when you are." },
};

/** Shows a system notification while the app is in the background. Same tag as the push, so never twice. */
const notifyInBackground = async (title: string, body: string) => {
  if (document.visibilityState === "visible") return;
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    await registration?.showNotification(title, { body, tag: "focus-timer", icon: "/icon-192.png" });
  } catch {
    // Best effort.
  }
};

/**
 * Mounted once in the app shell. Announces the end of a phase (chime, toast,
 * notification when hidden) and keeps a server-side push scheduled for the
 * end of a running phase, so a closed or suspended app still hears about it.
 */
export const useFocusAlerts = () => {
  const client = useApiClient();
  const state = useFocusState();
  const scheduledFor = useRef<number | null>(null);

  useEffect(
    () =>
      onFocusFinish((finished, next) => {
        const message = MESSAGES[finished];
        playChime();
        toast(message.title, { description: `${message.body} Next: ${PHASE_LABELS[next].toLowerCase()}.` });
        void notifyInBackground(message.title, message.body);
      }),
    [],
  );

  useEffect(() => {
    const endsAt = state.endsAt;
    if (endsAt === scheduledFor.current) return;
    const previous = scheduledFor.current;
    scheduledFor.current = endsAt;
    if (endsAt === null) {
      if (previous !== null) void client.delete("/push/timer").catch(() => undefined);
      return;
    }
    const message = MESSAGES[state.phase];
    // A couple of seconds late, so an open app settles it (and cancels this) first.
    void client
      .put("/push/timer", { endsAt: new Date(endsAt + 2_000).toISOString(), title: message.title, body: message.body })
      .catch(() => undefined);
  }, [client, state.endsAt, state.phase]);
};
