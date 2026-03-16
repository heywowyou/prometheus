import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./app/AppShell";
import TodosDashboardPage from "./features/todos/pages/TodosDashboardPage";
import MediaDashboardPage from "./features/media/pages/MediaDashboardPage";
import MoviesPanelPage from "./features/media/pages/MoviesPanelPage";
import TvPanelPage from "./features/media/pages/TvPanelPage";
import BooksPanelPage from "./features/media/pages/BooksPanelPage";
import MusicPanelPage from "./features/media/pages/MusicPanelPage";
import GamesPanelPage from "./features/media/pages/GamesPanelPage";

function App() {
  return (
    <BrowserRouter unstable_useTransitions>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/todos" replace />} />
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
          <Route path="/notes" element={<div>Notes – Coming soon</div>} />
          <Route path="/calendar" element={<div>Calendar – Coming soon</div>} />
          <Route path="/workouts" element={<div>Workouts – Coming soon</div>} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;

