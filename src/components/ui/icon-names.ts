import { iconNames } from "lucide-react/dynamic";
import { CURATED_ICONS } from "./icon-set";

const ALL_NAMES = new Set<string>(iconNames);

/** Emojis from before icons were Lucide, drawn as their nearest Lucide icon. */
const EMOJI_TO_ICON: Record<string, string> = {
  "📝": "notebook-pen", "📌": "pin", "💡": "lightbulb", "✅": "check-circle", "⭐": "star", "🔥": "flame",
  "📚": "library", "🎯": "target", "🧠": "brain", "🗂️": "folder", "📅": "calendar", "🗓️": "calendar",
  "✍️": "pen-tool", "📖": "book-open", "🔖": "bookmark", "📎": "link", "🏠": "house", "🍳": "utensils",
  "🛒": "shopping-cart", "✈️": "plane", "🧳": "luggage", "🏖️": "palmtree", "🎁": "gift", "💰": "wallet",
  "🩺": "heart-pulse", "🧘": "person-standing", "🏋️": "dumbbell", "🚴": "bike", "🏃": "footprints", "⚽": "trophy",
  "🎸": "guitar", "🎧": "headphones", "💼": "briefcase", "💻": "laptop", "🛠️": "wrench", "⚙️": "settings",
  "🧪": "flask-conical", "📈": "chart-line", "📊": "chart-bar", "🗺️": "map", "🧭": "compass", "🚀": "rocket",
  "🔒": "lock", "🔑": "key", "📨": "mail", "☎️": "phone", "🤝": "users", "🏆": "trophy", "🎬": "clapperboard",
  "📺": "tv", "🎮": "gamepad-2", "🎵": "music", "📷": "camera", "🎨": "palette", "🖋️": "pen-tool",
  "🎭": "drama", "📻": "radio", "🍿": "popcorn", "🕹️": "gamepad-2", "🎲": "dice-5", "🖼️": "image",
  "🎤": "mic", "📽️": "film", "🎞️": "film", "🌱": "sprout", "🌿": "leaf", "🌻": "flower-2", "🌙": "moon",
  "☀️": "sun", "🌊": "waves", "⛰️": "mountain", "🌲": "trees", "🍂": "leaf", "❄️": "snowflake",
  "🌧️": "cloud-rain", "🌈": "rainbow", "🐾": "paw-print", "🦊": "paw-print", "🐈": "cat", "🐕": "dog",
  "❤️": "heart", "💚": "heart", "💙": "heart", "🖤": "heart", "⚡": "zap", "✨": "sparkles",
  "💬": "message-circle", "❓": "circle-help", "❗": "circle-alert", "⚠️": "triangle-alert",
};

/** The Lucide name a stored icon stands for, or null when there's nothing to draw. */
export const iconNameOf = (value?: string | null): string | null => {
  if (!value) return null;
  if (CURATED_ICONS[value] || ALL_NAMES.has(value)) return value;
  return EMOJI_TO_ICON[value] ?? null;
};
