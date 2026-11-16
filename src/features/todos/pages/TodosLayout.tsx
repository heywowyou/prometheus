import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useSearchParams } from "react-router-dom";
import { Archive, BookCheck, CalendarDays, Inbox, Layers, PanelLeft, Star } from "lucide-react";
import { cn } from "@lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@components/ui/sheet";
import { useTaskData } from "../hooks/useTaskData";
import { TasksUiContext, type TasksUi } from "../tasks-ui";
import TodosSidebar from "../components/TodosSidebar";

const PHONE_LISTS = [
  { to: "/todos/today", label: "Today", icon: Star },
  { to: "/todos/inbox", label: "Inbox", icon: Inbox },
  { to: "/todos/upcoming", label: "Upcoming", icon: CalendarDays },
  { to: "/todos/anytime", label: "Anytime", icon: Layers },
  { to: "/todos/someday", label: "Someday", icon: Archive },
  { to: "/todos/logbook", label: "Logbook", icon: BookCheck },
];

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
  const [params] = useSearchParams();
  const taskParam = params.get("task");
  const [openedFromLink, setOpenedFromLink] = useState<string | null>(null);

  // A route change closes the open task and the phone sheet.
  if (shownPath !== pathname) {
    setShownPath(pathname);
    setOpenId(null);
    setSheetOpen(false);
  }
  // `?task=<id>` (from search) opens that task once.
  if (taskParam && taskParam !== openedFromLink) {
    setOpenedFromLink(taskParam);
    setOpenId(taskParam);
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
          {/* Phones: the main lists as chips, projects and areas in the sheet. */}
          <nav
            aria-label="Lists"
            className="-mx-5 mb-4 flex gap-1.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:hidden"
          >
            {PHONE_LISTS.map((list) => {
              const count =
                list.to === "/todos/inbox"
                  ? data.index.inbox.filter((todo) => !todo.completed).length
                  : list.to === "/todos/today"
                    ? [...data.index.todayList, ...data.index.evening].filter((todo) => !todo.completed).length
                    : 0;
              return (
                <NavLink
                  key={list.to}
                  to={list.to}
                  className={({ isActive }) =>
                    cn(
                      "flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors",
                      isActive ? "border-transparent bg-primary font-medium text-primary-foreground" : "border-border bg-card text-soft",
                    )
                  }
                >
                  <list.icon className="h-3.5 w-3.5" />
                  {list.label}
                  {count > 0 && <span className="tabular-nums opacity-70">{count}</span>}
                </NavLink>
              );
            })}
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-sm text-soft"
            >
              <PanelLeft className="h-3.5 w-3.5" /> Projects
            </button>
          </nav>
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
