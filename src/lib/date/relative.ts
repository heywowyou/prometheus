const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "Just now", "3 hours ago", "Yesterday", "Mar 4", "Mar 4, 2024". */
export const relativeDate = (
  value: string | Date,
  now: Date = new Date(),
): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const elapsed = now.getTime() - date.getTime();

  if (elapsed < MINUTE) return "Just now";

  if (elapsed < HOUR) {
    const minutes = Math.floor(elapsed / MINUTE);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  if (elapsed < DAY) {
    const hours = Math.floor(elapsed / HOUR);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(elapsed / DAY);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    // Only show the year once it differs, to keep the line short.
    ...(now.getFullYear() === date.getFullYear() ? {} : { year: "numeric" }),
  });
};
