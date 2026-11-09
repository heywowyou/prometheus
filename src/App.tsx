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

// Route-level code splitting. The notes editor in particular pulls in Tiptap
// and its highlighting bundle, which no other route needs.
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

function App() {
  return (
    <BrowserRouter unstable_useTransitions>
      <Routes>
        {/* Public routes — rendered without the app shell. */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/sign-in/*" element={<AuthPage mode="sign-in" />} />
        <Route path="/sign-up/*" element={<AuthPage mode="sign-up" />} />

        {/* Signed-in routes — auth boundary, then shell. */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
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
            <Route
              path="/workouts"
              element={<ComingSoonPage title="Workouts" />}
            />

            <Route path="*" element={<Navigate to="/todos" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
