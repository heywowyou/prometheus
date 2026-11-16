import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { PanelLeft } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@components/ui/sheet";
import { useTaskData } from "../hooks/useTaskData";
import { TasksUiContext, type TasksUi } from "../tasks-ui";
import TodosSidebar from "../components/TodosSidebar";

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/** The to-do app: list sidebar (a sheet on phones) around the routed list. */
export default function TodosLayout() {
  const data = useTaskData();
  const { pathname } = useLocation();
  const [openId, setOpenId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [shownPath, setShownPath] = useState(pathname);
  const newTaskRef = useRef<(() => void) | null>(null);

  // A route change closes the open task and the phone sheet.
  if (shownPath !== pathname) {
    setShownPath(pathname);
    setOpenId(null);
    setSheetOpen(false);
  }

  const registerNewTask = useCallback((focus: (() => void) | null) => {
    newTaskRef.current = focus;
  }, []);

  const ui = useMemo<TasksUi>(
    () => ({
      openId,
      setOpenId,
      openSidebar: () => setSheetOpen(true),
      focusNewTask: () => newTaskRef.current?.(),
      registerNewTask,
    }),
    [openId, registerNewTask],
  );

  // "n" adds a task to the list on screen.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "n" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTyping(event.target) || document.querySelector("[role=dialog]")) return;
      if (!newTaskRef.current) return;
      event.preventDefault();
      setOpenId(null);
      newTaskRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <TasksUiContext.Provider value={ui}>
      <div className="flex gap-10">
        <aside
          data-app-chrome
          className="sticky top-24 hidden max-h-[calc(100dvh-7rem)] w-60 shrink-0 overflow-y-auto pb-4 lg:flex"
        >
          <TodosSidebar data={data} className="w-full" />
        </aside>
        <div className="min-w-0 flex-1">
          <div className="mb-4 lg:hidden">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-sm text-soft"
            >
              <PanelLeft className="h-4 w-4" /> Lists
            </button>
          </div>
          <div className="mx-auto max-w-3xl">
            <Outlet context={data} />
          </div>
        </div>
      </div>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="gap-2">
          <SheetTitle className="sr-only">Lists</SheetTitle>
          <SheetDescription className="sr-only">Inbox, Today, projects and areas</SheetDescription>
          <TodosSidebar data={data} onNavigate={() => setSheetOpen(false)} className="min-h-0 overflow-y-auto px-1 pb-2" />
        </SheetContent>
      </Sheet>
    </TasksUiContext.Provider>
  );
}
