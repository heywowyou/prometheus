import {
  Sun,
  CheckSquare,
  Clapperboard,
  NotebookText,
  CalendarDays,
  Dumbbell,
} from "lucide-react";

/** The subapps shown in the header, in order. */
export const NAV_ITEMS = [
  { to: "/today", label: "Today", icon: Sun },
  { to: "/todos", label: "Todos", icon: CheckSquare },
  { to: "/media", label: "Media", icon: Clapperboard },
  { to: "/notes", label: "Notes", icon: NotebookText },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/workouts", label: "Workouts", icon: Dumbbell },
] as const;

/** Where signed-in users land. */
export const DEFAULT_ROUTE = "/today";
