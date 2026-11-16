import { lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "@app/AppShell";
import ProtectedRoute from "@app/ProtectedRoute";
import LandingPage from "@app/pages/LandingPage";
import AuthPage from "@app/pages/AuthPage";
import MediaPanelPage from "@features/media/pages/MediaPanelPage";
import {
  MEDIA_TYPE_CONFIGS,
  DEFAULT_MEDIA_SLUG,
} from "@features/media/media-config";
import { DEFAULT_ROUTE } from "@app/navigation";

// Route-level code splitting. The notes editor in particular pulls in Tiptap
// and its highlighting bundle, which no other route needs.
const TodayPage = lazy(() => import("@features/today/pages/TodayPage"));
const TodosLayout = lazy(() => import("@features/todos/pages/TodosLayout"));
const HabitsPage = lazy(() => import("@features/todos/pages/HabitsPage"));
const CalendarPage = lazy(() => import("@features/calendar/pages/CalendarPage"));
const TodoListPages = {
  Inbox: lazy(() => import("@features/todos/pages/TaskListPages").then((m) => ({ default: m.InboxPage }))),
  Today: lazy(() => import("@features/todos/pages/TaskListPages").then((m) => ({ default: m.TodayListPage }))),
  Upcoming: lazy(() => import("@features/todos/pages/TaskListPages").then((m) => ({ default: m.UpcomingPage }))),
  Anytime: lazy(() => import("@features/todos/pages/TaskListPages").then((m) => ({ default: m.AnytimePage }))),
  Someday: lazy(() => import("@features/todos/pages/TaskListPages").then((m) => ({ default: m.SomedayPage }))),
  Logbook: lazy(() => import("@features/todos/pages/ListPages").then((m) => ({ default: m.LogbookPage }))),
  Project: lazy(() => import("@features/todos/pages/ListPages").then((m) => ({ default: m.ProjectPage }))),
  Area: lazy(() => import("@features/todos/pages/ListPages").then((m) => ({ default: m.AreaPage }))),
};
const MediaDashboardPage = lazy(
  () => import("@features/media/pages/MediaDashboardPage"),
);
const NotesDashboardPage = lazy(
  () => import("@features/notes/pages/NotesDashboardPage"),
);
const NoteEditorPage = lazy(
  () => import("@features/notes/pages/NoteEditorPage"),
);
const NotesLayout = lazy(() => import("@features/notes/pages/NotesLayout"));
const NotesHomePage = lazy(() => import("@features/notes/pages/NotesHomePage"));
const DailyNoteRoute = lazy(() => import("@features/notes/pages/DailyNoteRoute"));
const GraphPage = lazy(() => import("@features/notes/pages/GraphPage"));
const ProfilePage = lazy(() => import("@features/profile/pages/ProfilePage"));
const WorkoutsLayout = lazy(
  () => import("@features/workouts/pages/WorkoutsLayout"),
);
const WorkoutStartPage = lazy(
  () => import("@features/workouts/pages/StartPage"),
);
const WorkoutHistoryPage = lazy(
  () => import("@features/workouts/pages/HistoryPage"),
);
const ExercisesPage = lazy(
  () => import("@features/workouts/pages/ExercisesPage"),
);
const ExerciseProgressPage = lazy(
  () => import("@features/workouts/pages/ExerciseProgressPage"),
);
const RoutineEditorPage = lazy(
  () => import("@features/workouts/pages/RoutineEditorPage"),
);
const WorkoutSessionPage = lazy(
  () => import("@features/workouts/pages/SessionPage"),
);

function App() {
  return (
    <BrowserRouter useTransitions>
      <Routes>
        {/* Public routes — rendered without the app shell. */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/sign-in/*" element={<AuthPage mode="sign-in" />} />
        <Route path="/sign-up/*" element={<AuthPage mode="sign-up" />} />

        {/* Signed-in routes — auth boundary, then shell. */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/today" element={<TodayPage />} />
            {/* To-dos: Things-style lists in a sidebar, plus Habits. */}
            <Route path="/todos" element={<TodosLayout />}>
              <Route index element={<Navigate to="today" replace />} />
              <Route path="inbox" element={<TodoListPages.Inbox />} />
              <Route path="today" element={<TodoListPages.Today />} />
              <Route path="upcoming" element={<TodoListPages.Upcoming />} />
              <Route path="anytime" element={<TodoListPages.Anytime />} />
              <Route path="someday" element={<TodoListPages.Someday />} />
              <Route path="logbook" element={<TodoListPages.Logbook />} />
              <Route path="habits" element={<HabitsPage />} />
              <Route path="projects/:id" element={<TodoListPages.Project />} />
              <Route path="areas/:id" element={<TodoListPages.Area />} />
            </Route>

            <Route path="/media" element={<MediaDashboardPage />}>
              <Route index element={<Navigate to={DEFAULT_MEDIA_SLUG} replace />} />
              {MEDIA_TYPE_CONFIGS.map((config) => (
                <Route
                  key={config.slug}
                  path={config.slug}
                  element={<MediaPanelPage config={config} />}
                />
              ))}
            </Route>

            {/* Notes: a sidebar of pages around the home, editor, journal and graph. */}
            <Route path="/notes" element={<NotesLayout />}>
              <Route index element={<NotesHomePage />} />
              <Route path="all" element={<NotesDashboardPage />} />
              <Route path="graph" element={<GraphPage />} />
              <Route path="daily/:date" element={<DailyNoteRoute />} />
              <Route path=":id" element={<NoteEditorPage />} />
            </Route>

            <Route path="/calendar" element={<CalendarPage />} />

            {/* Tabbed hub; the full-screen pages below sit outside the tabs. */}
            <Route path="/workouts" element={<WorkoutsLayout />}>
              <Route index element={<WorkoutStartPage />} />
              <Route path="history" element={<WorkoutHistoryPage />} />
              <Route path="exercises" element={<ExercisesPage />} />
            </Route>
            <Route path="/workouts/exercises/:id" element={<ExerciseProgressPage />} />
            <Route path="/workouts/routines/:id" element={<RoutineEditorPage />} />
            <Route path="/workouts/session/:id" element={<WorkoutSessionPage />} />

            <Route path="/profile" element={<ProfilePage />} />

            <Route path="*" element={<Navigate to={DEFAULT_ROUTE} replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
