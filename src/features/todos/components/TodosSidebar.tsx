import { useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Archive,
  Bell,
  BellOff,
  BookCheck,
  Box,
  CalendarDays,
  Inbox,
  Layers,
  Plus,
  Star,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { cn } from "@lib/utils";
import { usePushNotifications } from "@lib/push/usePushNotifications";
import type { useTaskData } from "../hooks/useTaskData";
import ProgressPie from "./tasks/ProgressPie";

type TaskData = ReturnType<typeof useTaskData>;

function Row({
  to,
  icon,
  label,
  count,
  countTone,
  onNavigate,
  end,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  count?: number;
  countTone?: "danger";
  onNavigate?: () => void;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex h-8 items-center gap-2.5 rounded-lg px-2 text-sm transition-colors",
          isActive ? "bg-raised text-foreground" : "text-soft hover:bg-secondary hover:text-foreground",
        )
      }
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count ? (
        <span
          className={cn(
            "text-xs tabular-nums",
            countTone === "danger" ? "rounded-full bg-destructive/20 px-1.5 text-destructive" : "text-muted-foreground",
          )}
        >
          {count}
        </span>
      ) : null}
    </NavLink>
  );
}

function NotificationsRow() {
  const push = usePushNotifications();
  if (push.state === "unsupported") return null;
  const hint =
    push.state === "home-screen"
      ? "Add Prometheus to your Home Screen to get reminders"
      : push.state === "denied"
        ? "Notifications are blocked in this browser's settings"
        : null;
  return (
    <div className="px-2 text-xs text-muted-foreground">
      {hint ? (
        <p className="flex items-start gap-2">
          <BellOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {hint}
        </p>
      ) : push.state === "on" ? (
        <p className="flex items-center gap-2">
          <Bell className="h-3.5 w-3.5 text-rating" />
          Reminders on
          <button type="button" onClick={() => void push.test()} className="hover:text-foreground">
            · Test
          </button>
          <button type="button" onClick={() => void push.disable()} className="ml-auto hover:text-foreground">
            Turn off
          </button>
        </p>
      ) : (
        <button
          type="button"
          disabled={push.busy}
          onClick={() => void push.enable()}
          className="flex items-center gap-2 hover:text-foreground"
        >
          <Bell className="h-3.5 w-3.5" />
          Turn on reminders
        </button>
      )}
    </div>
  );
}

/** Things' sidebar: the six lists, Habits, then areas holding projects. */
export default function TodosSidebar({
  data,
  onNavigate,
  className,
}: {
  data: TaskData;
  onNavigate?: () => void;
  className?: string;
}) {
  const navigate = useNavigate();
  const { index, areas, projects } = data;
  const [creating, setCreating] = useState(false);
  const overdueToday = [...index.todayList, ...index.evening].filter(
    (todo) => !todo.completed && todo.dueDate && todo.dueDate < index.today,
  ).length;
  const todayOpen = [...index.todayList, ...index.evening].filter((todo) => !todo.completed).length;
  const inboxOpen = index.inbox.filter((todo) => !todo.completed).length;
  const looseProjects = projects.filter((project) => !project.areaId);

  const projectRow = (project: (typeof projects)[number]) => {
    const progress = index.projectProgress(project._id);
    return (
      <Row
        key={project._id}
        to={`/todos/projects/${project._id}`}
        icon={<ProgressPie done={progress.done} total={progress.total} className="text-info" />}
        label={project.title || "New project"}
        count={index.inProject(project._id).filter((todo) => !todo.completed).length || undefined}
        onNavigate={onNavigate}
      />
    );
  };

  const newProject = async (areaId: string | null = null) => {
    setCreating(true);
    try {
      const project = await data.createProject({ title: "", areaId });
      onNavigate?.();
      navigate(`/todos/projects/${project._id}?new=1`);
    } finally {
      setCreating(false);
    }
  };

  const newArea = async () => {
    setCreating(true);
    try {
      const area = await data.createArea("");
      onNavigate?.();
      navigate(`/todos/areas/${area._id}?new=1`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <nav className="space-y-0.5" aria-label="Lists">
        <Row to="/todos/inbox" icon={<Inbox className="h-4 w-4 text-info" />} label="Inbox" count={inboxOpen} onNavigate={onNavigate} />
        <div className="h-2" />
        <Row
          to="/todos/today"
          icon={<Star className="h-4 w-4 fill-warning text-warning" />}
          label="Today"
          count={overdueToday || todayOpen}
          countTone={overdueToday ? "danger" : undefined}
          onNavigate={onNavigate}
        />
        <Row to="/todos/upcoming" icon={<CalendarDays className="h-4 w-4 text-destructive/80" />} label="Upcoming" onNavigate={onNavigate} />
        <Row to="/todos/anytime" icon={<Layers className="h-4 w-4 text-rating" />} label="Anytime" onNavigate={onNavigate} />
        {index.someday.length > 0 && (
          <Row to="/todos/someday" icon={<Archive className="h-4 w-4 text-muted-foreground" />} label="Someday" onNavigate={onNavigate} />
        )}
        <div className="h-2" />
        <Row to="/todos/logbook" icon={<BookCheck className="h-4 w-4 text-rating" />} label="Logbook" onNavigate={onNavigate} />
      </nav>

      {(looseProjects.length > 0 || areas.length > 0) && (
        <nav className="space-y-0.5" aria-label="Projects and areas">
          {looseProjects.map(projectRow)}
          {areas.map((area) => (
            <div key={area._id} className="pt-3">
              <Row
                to={`/todos/areas/${area._id}`}
                icon={<Box className="h-4 w-4 text-muted-foreground" />}
                label={area.title || "New area"}
                onNavigate={onNavigate}
              />
              {projects.filter((project) => project.areaId === area._id).map(projectRow)}
            </div>
          ))}
        </nav>
      )}

      <div className="mt-auto space-y-3 border-t border-border pt-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={creating}
              className="flex h-8 w-full items-center gap-2.5 rounded-lg px-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <Plus className="h-4 w-4" /> New list
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuItem onClick={() => void newProject()}>
              <Box className="h-4 w-4 text-info" />
              <span>
                <span className="block">New project</span>
                <span className="block text-xs text-muted-foreground">An outcome with a set of tasks</span>
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void newArea()}>
              <Layers className="h-4 w-4" />
              <span>
                <span className="block">New area</span>
                <span className="block text-xs text-muted-foreground">A part of life, like Home or Work</span>
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <NotificationsRow />
      </div>
    </div>
  );
}
