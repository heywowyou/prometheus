import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useApiClient } from "@lib/api/api-client";
import { getErrorMessage } from "@lib/api/errors";

/** The VAPID key as the bytes `pushManager.subscribe` wants. */
const keyBytes = (base64: string) => {
  const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
};

export const pushSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

/** True on an iPhone or iPad browser tab, where push only works once added to the Home Screen. */
export const needsHomeScreen = () =>
  typeof navigator !== "undefined" &&
  /iPhone|iPad|iPod/.test(navigator.userAgent) &&
  !window.matchMedia("(display-mode: standalone)").matches;

export type PushState = "unsupported" | "home-screen" | "denied" | "off" | "on";

/** Turns task reminders on or off for this device. */
export const usePushNotifications = () => {
  const client = useApiClient();
  const [state, setState] = useState<PushState>("off");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!pushSupported()) {
      setState(needsHomeScreen() ? "home-screen" : "unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    const registration = await navigator.serviceWorker.getRegistration("/sw.js");
    const subscription = await registration?.pushManager.getSubscription();
    setState(subscription ? "on" : "off");
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enable = useCallback(async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const { data } = await client.get<{ publicKey: string }>("/push/key");
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyBytes(data.publicKey),
        }));
      await client.post("/push/subscriptions", subscription.toJSON());
      setState("on");
      toast("Reminders are on for this device");
    } catch (error) {
      toast.error(`Couldn't turn on reminders: ${getErrorMessage(error)}`);
    } finally {
      setBusy(false);
    }
  }, [client]);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await client.delete("/push/subscriptions", { data: { endpoint: subscription.endpoint } });
        await subscription.unsubscribe();
      }
      setState("off");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }, [client]);

  const test = useCallback(async () => {
    try {
      const { data } = await client.post<{ delivered: number }>("/push/test");
      if (data.delivered === 0) toast("No device is subscribed yet");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [client]);

  return { state, busy, enable, disable, test };
};
