/**
 * Display and input conversions. The API stores kg, seconds and metres; the
 * UI shows kg, km and minutes.
 */

const trim = (value: number, digits = 1) =>
  Number.isInteger(value) ? String(value) : value.toFixed(digits).replace(/\.?0+$/, "");

export const formatWeight = (kg: number) => `${trim(kg, 2)} kg`;

export const formatVolume = (kg: number) =>
  kg >= 10_000 ? `${trim(kg / 1000, 1)} t` : `${Math.round(kg).toLocaleString()} kg`;

export const formatDistance = (m: number) => (m >= 1000 ? `${trim(m / 1000, 2)} km` : `${Math.round(m)} m`);

/** 300 → "5:00 /km". */
export const formatPace = (secPerKm: number) => {
  const minutes = Math.floor(secPerKm / 60);
  return `${minutes}:${String(Math.round(secPerKm % 60)).padStart(2, "0")} /km`;
};

/** "82,5" (French keyboard) and "82.5" both parse; blank is undefined. */
export const parseDecimal = (raw: string): number | undefined => {
  const cleaned = raw.trim().replace(",", ".");
  if (cleaned === "") return undefined;
  const value = Number(cleaned);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
};

/** Shown in inputs: up to 2 decimals, no trailing zeros. */
export const numberToInput = (value: number | undefined) =>
  value === undefined ? "" : trim(value, 2);

/** One set as text: "80 kg × 5", "12 reps", "5 km · 25 min". */
export const describeSet = (
  kind: "strength" | "cardio",
  set: { reps?: number; weightKg?: number; durationSec?: number; distanceM?: number },
) => {
  if (kind === "strength") {
    if (!set.reps) return "–";
    return set.weightKg ? `${trim(set.weightKg, 2)} × ${set.reps}` : `${set.reps} reps`;
  }
  const parts = [
    set.distanceM ? formatDistance(set.distanceM) : null,
    set.durationSec ? `${trim(set.durationSec / 60, 1)} min` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "–";
};

export const formatSessionDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

/** Rest timer lengths offered per exercise, in seconds (0 = no timer). */
export const REST_OPTIONS = [0, 30, 60, 90, 120, 180, 300] as const;

/** 90 → "1:30"; 120 → "2 min"; 0 → "Off". */
export const restLabel = (sec: number) => {
  if (sec === 0) return "Off";
  if (sec < 60) return `${sec} s`;
  return sec % 60 ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}` : `${sec / 60} min`;
};
