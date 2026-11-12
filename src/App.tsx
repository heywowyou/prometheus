import { lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "@app/AppShell";
import ProtectedRoute from "@app/ProtectedRoute";
import LandingPage from "@app/pages/LandingPage";
import AuthPage from "@app/pages/AuthPage";
import ComingSoonPage from "@app/pages/ComingSoonPage";
import MediaPanelPage from "@features/media/pages/MediaPanelPage";
import {
  MEDIA_TYPE_CONFIGS,
  DEFAULT_MEDIA_SLUG,
} from "@features/media/media-config";
import { DEFAULT_ROUTE } from "@app/navigation";

// Route-level code splitting. The notes editor in particular pulls in Tiptap
// and its highlighting bundle, which no other route needs.
const TodayPage = lazy(() => import("@features/today/pages/TodayPage"));
const TodosDashboardPage = lazy(
  () => import("@features/todos/pages/TodosDashboardPage"),
);
const MediaDashboardPage = lazy(
  () => import("@features/media/pages/MediaDashboardPage"),
);
const NotesDashboardPage = lazy(
  () => import("@features/notes/pages/NotesDashboardPage"),
);
const NoteEditorPage = lazy(
  () => import("@features/notes/pages/NoteEditorPage"),
);
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
            <Route path="/todos" element={<TodosDashboardPage />} />

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

            <Route path="/notes" element={<NotesDashboardPage />} />
            <Route path="/notes/:id" element={<NoteEditorPage />} />

            <Route
              path="/calendar"
              element={<ComingSoonPage title="Calendar" />}
            />

            {/* Tabbed hub; the full-screen pages below sit outside the tabs. */}
            <Route path="/workouts" element={<WorkoutsLayout />}>
              <Route index element={<WorkoutStartPage />} />
              <Route path="history" element={<WorkoutHistoryPage />} />
              <Route path="exercises" element={<ExercisesPage />} />
            </Route>
            <Route path="/workouts/exercises/:id" element={<ExerciseProgressPage />} />
            <Route path="/workouts/routines/:id" element={<RoutineEditorPage />} />
            <Route path="/workouts/session/:id" element={<WorkoutSessionPage />} />

            <Route path="*" element={<Navigate to={DEFAULT_ROUTE} replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
