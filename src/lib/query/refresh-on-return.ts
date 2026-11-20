import type { QueryClient } from "@tanstack/react-query";

/** Shorter trips away (a notification shade, a quick app switch) don't count. */
const AWAY_MS = 2_000;

/**
 * Refetch what's on screen whenever you come back to the app.
 *
 * Data also changes outside the app (Claude through the MCP connector, the
 * reminder job, another device), so "fresh for 30 s" isn't enough: coming back
 * after any real absence refetches every query that's on screen, whatever its
 * age. Queries kept on purpose (`staleTime: Infinity`: a live workout, a
 * stored version) are left alone.
 *
 * TanStack Query only listens to `visibilitychange`. That misses two cases:
 * a desktop window next to Claude never becomes hidden (it only loses focus),
 * and an iPhone Home Screen app resumed from the background sometimes comes
 * back through `pageshow` without a visibility event. Both are covered here.
 */
export function refreshOnReturn(queryClient: QueryClient): () => void {
  let leftAt: number | null = null;

  const leave = () => {
    leftAt ??= Date.now();
  };

  const back = () => {
    if (leftAt === null) return;
    const away = Date.now() - leftAt;
    leftAt = null;
    if (away < AWAY_MS) return;
    void queryClient.invalidateQueries({
      refetchType: "active",
      predicate: (query) => (query.options as { staleTime?: unknown }).staleTime !== Infinity,
    });
  };

  const onVisibility = () => (document.visibilityState === "hidden" ? leave() : back());
  const onOnline = () => {
    leftAt = 0;
    back();
  };

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("blur", leave);
  window.addEventListener("focus", back);
  window.addEventListener("pagehide", leave);
  window.addEventListener("pageshow", back);
  window.addEventListener("online", onOnline);

  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("blur", leave);
    window.removeEventListener("focus", back);
    window.removeEventListener("pagehide", leave);
    window.removeEventListener("pageshow", back);
    window.removeEventListener("online", onOnline);
  };
}
