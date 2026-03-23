import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./app/AppShell";
import ProtectedRoute from "./app/ProtectedRoute";
import LandingPage from "./app/pages/LandingPage";
import SignInPage from "./app/pages/SignInPage";
import SignUpPage from "./app/pages/SignUpPage";
import TodosDashboardPage from "./features/todos/pages/TodosDashboardPage";
import MediaDashboardPage from "./features/media/pages/MediaDashboardPage";
import MoviesPanelPage from "./features/media/pages/MoviesPanelPage";
import TvPanelPage from "./features/media/pages/TvPanelPage";
import BooksPanelPage from "./features/media/pages/BooksPanelPage";
import MusicPanelPage from "./features/media/pages/MusicPanelPage";
import GamesPanelPage from "./features/media/pages/GamesPanelPage";
import NotesDashboardPage from "./features/notes/pages/NotesDashboardPage";
import NoteEditorPage from "./features/notes/pages/NoteEditorPage";

function App() {
  return (
    <BrowserRouter unstable_useTransitions>
      <Routes>
        {/* Public routes — no app shell */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />

        {/* Protected routes — auth check then app shell */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/todos" element={<TodosDashboardPage />} />
            <Route path="/media" element={<Navigate to="/media/movies" replace />} />
            <Route path="/media/*" element={<MediaDashboardPage />}>
              <Route index element={<Navigate to="movies" replace />} />
              <Route path="movies" element={<MoviesPanelPage />} />
              <Route path="tv" element={<TvPanelPage />} />
              <Route path="books" element={<BooksPanelPage />} />
              <Route path="music" element={<MusicPanelPage />} />
              <Route path="games" element={<GamesPanelPage />} />
            </Route>
            <Route path="/notes" element={<NotesDashboardPage />} />
            <Route path="/notes/:id" element={<NoteEditorPage />} />
            <Route path="/calendar" element={<div>Calendar – Coming soon</div>} />
            <Route path="/workouts" element={<div>Workouts – Coming soon</div>} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
