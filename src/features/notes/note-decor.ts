import type { NoteCover } from "./types/note-types";

/** Cool, quiet gradients only: sage, slate, teal, blue, mist. */
export const COVER_GRADIENTS = [
  "linear-gradient(135deg, #1f3b37 0%, #2c333f 55%, #0f1217 100%)",
  "linear-gradient(135deg, #2b3d55 0%, #1d222b 60%, #0f1217 100%)",
  "linear-gradient(135deg, #234544 0%, #1b2726 55%, #0f1217 100%)",
  "linear-gradient(135deg, #24384f 0%, #1a2433 55%, #0f1217 100%)",
  "linear-gradient(160deg, #9fcdee 0%, #3c5a73 45%, #0f1217 100%)",
  "linear-gradient(160deg, #8fcba8 0%, #3d6b5a 45%, #0f1217 100%)",
];

/** Purple and warm gradients that were offered before, drawn as their calm replacements. */
const RETIRED_GRADIENTS: Record<string, string> = {
  "linear-gradient(135deg, #3b2f4a 0%, #1d222b 60%, #0f1217 100%)": COVER_GRADIENTS[1] as string,
  "linear-gradient(135deg, #4a3a2a 0%, #2a2420 55%, #0f1217 100%)": COVER_GRADIENTS[2] as string,
  "linear-gradient(135deg, #5a3a3a 0%, #2b1f22 55%, #0f1217 100%)": COVER_GRADIENTS[4] as string,
};

/** CSS background for a stored cover. */
export const coverBackground = (cover: NoteCover) =>
  cover.url.startsWith("linear-gradient(")
    ? (RETIRED_GRADIENTS[cover.url] ?? cover.url)
    : `center / cover no-repeat url("${cover.url.replace(/"/g, "%22")}")`;

