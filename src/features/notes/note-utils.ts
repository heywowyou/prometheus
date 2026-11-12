/**
 * Same rules as the API's `normaliseTags`: lower-case, spaces → dashes, no
 * leading "#", at most 40 characters. Normalising on input means the chip the
 * user sees is exactly the tag that gets stored.
 */
export const normaliseTag = (raw: string): string => {
  const tag = raw.trim().toLowerCase().replace(/\s+/g, "-").replace(/^#+/, "");
  return tag.length <= 40 ? tag : tag.slice(0, 40);
};

export const MAX_TAGS = 20;

const WORDS_PER_MINUTE = 230;

/** Word count of a note's Tiptap HTML. */
export const countWords = (html: string): number => {
  const text = html
    .replace(/<\/(p|h[1-6]|li|blockquote|pre)>|<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .trim();
  return text ? text.split(/\s+/).length : 0;
};

/** "312 words · 2 min read" */
export const describeLength = (words: number): string => {
  if (words === 0) return "";
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return `${words.toLocaleString()} word${words === 1 ? "" : "s"} · ${minutes} min read`;
};

/** Whole days left before a trashed note is deleted for good. */
export const daysUntilPurge = (
  deletedAt: string,
  retentionDays: number,
  now: Date = new Date(),
): number => {
  const elapsed = (now.getTime() - new Date(deletedAt).getTime()) / 86_400_000;
  return Math.max(0, Math.ceil(retentionDays - elapsed));
};
