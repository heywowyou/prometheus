/**
 * After a deploy, an app that stayed open still runs the old build, whose
 * pages point at code files the new build replaced. Asking for one returns
 * the HTML page instead ("'text/html' is not a valid JavaScript MIME type",
 * "Failed to fetch dynamically imported module"). Loading the page again
 * picks up the new build, so do that once, quietly.
 */

const KEY = "stale-chunk-reload";
/** One reload per this window: a real outage must not loop. */
const WINDOW_MS = 30_000;

const PATTERNS = [
  "Failed to fetch dynamically imported module",
  "error loading dynamically imported module",
  "Importing a module script failed",
  "is not a valid JavaScript MIME type",
  "Unable to preload CSS",
];

export function isStaleChunkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return PATTERNS.some((pattern) => message.includes(pattern));
}

/** Reloads once and returns true, or returns false if it just did. */
export function reloadForNewBuild(): boolean {
  try {
    const last = Number(sessionStorage.getItem(KEY) ?? 0);
    if (Date.now() - last < WINDOW_MS) return false;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    // No storage: still worth one try.
  }
  window.location.reload();
  return true;
}

/** Vite reports a failed lazy import here before React sees it. */
export function reloadOnStaleChunks() {
  window.addEventListener("vite:preloadError", (event) => {
    if (reloadForNewBuild()) event.preventDefault();
  });
}
