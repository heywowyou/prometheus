/** The subapps shown in the header, in order. */
export const NAV_ITEMS = [
  { to: "/todos", label: "Todos" },
  { to: "/media", label: "Media" },
  { to: "/notes", label: "Notes" },
  { to: "/calendar", label: "Calendar" },
  { to: "/workouts", label: "Workouts" },
] as const;

/** Where signed-in users land. */
export const DEFAULT_ROUTE = "/todos";
