import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./app/AppShell";
import TodosDashboardPage from "./features/todos/pages/TodosDashboardPage";

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/todos" replace />} />
          <Route path="/todos" element={<TodosDashboardPage />} />
          <Route path="/media" element={<div>Media – Coming soon</div>} />
          <Route path="/notes" element={<div>Notes – Coming soon</div>} />
          <Route path="/calendar" element={<div>Calendar – Coming soon</div>} />
          <Route path="/workouts" element={<div>Workouts – Coming soon</div>} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;

