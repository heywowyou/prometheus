import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { TasksUiContext, type TasksUi } from "../../tasks-ui";

/** Task lists outside the to-do app (Today page) share one open card through this. */
export default function TasksUiProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const newTaskRef = useRef<(() => void) | null>(null);
  const registerNewTask = useCallback((focus: (() => void) | null) => {
    newTaskRef.current = focus;
  }, []);
  const ui = useMemo<TasksUi>(
    () => ({
      openId,
      setOpenId,
      openSidebar: () => undefined,
      focusNewTask: () => newTaskRef.current?.(),
      registerNewTask,
    }),
    [openId, registerNewTask],
  );
  return <TasksUiContext.Provider value={ui}>{children}</TasksUiContext.Provider>;
}
