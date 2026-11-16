import {
  Sun,
  CheckSquare,
  Flame,
  Clapperboard,
  NotebookText,
  CalendarDays,
  Dumbbell,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

/** The subapps in the desktop header, in order of daily use. */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: "/today", label: "Today", icon: Sun },
  { to: "/todos", label: "Tasks", icon: CheckSquare },
  { to: "/habits", label: "Habits", icon: Flame },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/notes", label: "Notes", icon: NotebookText },
  { to: "/media", label: "Media", icon: Clapperboard },
  { to: "/workouts", label: "Workouts", icon: Dumbbell },
];

/**
 * The phone tab bar holds five destinations at most (Apple and Material both
 * recommend three to five); the rest live behind More. Today already shows the
 * day's agenda, the next workout and what's on the shelf, so those sections
 * lose least by sitting one tap deeper.
 */
export const PHONE_TABS: readonly NavItem[] = [
  { to: "/today", label: "Today", icon: Sun },
  { to: "/todos", label: "Tasks", icon: CheckSquare },
  { to: "/habits", label: "Habits", icon: Flame },
  { to: "/notes", label: "Notes", icon: NotebookText },
];

export const MORE_ITEMS: readonly NavItem[] = [
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/workouts", label: "Workouts", icon: Dumbbell },
  { to: "/media", label: "Media", icon: Clapperboard },
  { to: "/profile", label: "Profile", icon: UserRound },
];

/** Sections with a sidebar or a wide grid get the wide page width. */
export const isWidePath = (pathname: string) =>
  ["/notes", "/todos", "/calendar"].some((path) => pathname.startsWith(path));

/** Where signed-in users land. */
export const DEFAULT_ROUTE = "/today";
