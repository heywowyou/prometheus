import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@lib/query/keys";
import { useTodosApi, type LogbookScope, type ProjectPayload } from "../api/todos-api";
import type { TodoArea, TodoLists, TodoProject } from "../types/todo-types";

const EMPTY: TodoLists = { areas: [], projects: [] };

/** Areas and open projects, plus their mutations. */
export const useTodoLists = () => {
  const queryClient = useQueryClient();
  const api = useTodosApi();
  const key = queryKeys.todos.lists();

  const query = useQuery({ queryKey: key, queryFn: api.fetchLists, staleTime: 30_000 });

  const patch = (update: (lists: TodoLists) => TodoLists) =>
    queryClient.setQueryData<TodoLists>(key, (previous) => update(previous ?? EMPTY));

  const refreshAll = () => {
    void queryClient.invalidateQueries({ queryKey: key });
    void queryClient.invalidateQueries({ queryKey: queryKeys.todos.list() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.todos.logbook() });
  };

  const createArea = useMutation({
    mutationFn: api.createArea,
    onSuccess: (area) => patch((lists) => ({ ...lists, areas: [...lists.areas, area] })),
  });

  const updateArea = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => api.updateArea(id, { title }),
    onMutate: ({ id, title }) =>
      patch((lists) => ({
        ...lists,
        areas: lists.areas.map((area) => (area._id === id ? { ...area, title } : area)),
      })),
  });

  const deleteArea = useMutation({
    mutationFn: api.deleteArea,
    onSuccess: refreshAll,
  });

  const createProject = useMutation({
    mutationFn: api.createProject,
    onSuccess: (project) => patch((lists) => ({ ...lists, projects: [...lists.projects, project] })),
  });

  const updateProject = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProjectPayload }) => api.updateProject(id, payload),
    onMutate: ({ id, payload }) => {
      const { completed: _completed, headings: _headings, ...rest } = payload;
      patch((lists) => ({
        ...lists,
        projects: lists.projects.map((project) =>
          project._id === id ? { ...project, ...(rest as Partial<TodoProject>) } : project,
        ),
      }));
    },
    onSuccess: (project, { payload }) => {
      patch((lists) => ({
        ...lists,
        projects: project.completedAt
          ? lists.projects.filter((item) => item._id !== project._id)
          : lists.projects.some((item) => item._id === project._id)
            ? lists.projects.map((item) => (item._id === project._id ? project : item))
            : [...lists.projects, project],
      }));
      if (payload.completed !== undefined || payload.headings !== undefined) refreshAll();
    },
    onError: refreshAll,
  });

  const deleteProject = useMutation({
    mutationFn: api.deleteProject,
    onSuccess: refreshAll,
  });

  const reorder = useMutation({
    mutationFn: ({ kind, ids }: { kind: "area" | "project"; ids: string[] }) => api.reorderLists(kind, ids),
    onMutate: ({ kind, ids }) => {
      const position = new Map(ids.map((id, index) => [id, index]));
      patch((lists) =>
        kind === "area"
          ? { ...lists, areas: lists.areas.map((area) => ({ ...area, order: position.get(area._id) ?? area.order })) }
          : {
              ...lists,
              projects: lists.projects.map((project) => ({
                ...project,
                order: position.get(project._id) ?? project.order,
              })),
            },
      );
    },
    onError: refreshAll,
  });

  const lists = query.data ?? EMPTY;
  return {
    areas: [...lists.areas].sort((a, b) => a.order - b.order),
    projects: [...lists.projects].sort((a, b) => a.order - b.order),
    loading: query.isPending,
    createArea: (title: string): Promise<TodoArea> => createArea.mutateAsync(title),
    renameArea: (id: string, title: string) => updateArea.mutate({ id, title }),
    deleteArea: (id: string) => deleteArea.mutate(id),
    createProject: (payload: ProjectPayload): Promise<TodoProject> => createProject.mutateAsync(payload),
    updateProject: (id: string, payload: ProjectPayload) => updateProject.mutateAsync({ id, payload }),
    completeProject: (project: TodoProject) =>
      updateProject.mutate(
        { id: project._id, payload: { completed: true } },
        {
          onSuccess: () =>
            toast(`Completed “${project.title || "Untitled project"}”`, {
              action: {
                label: "Undo",
                onClick: () => updateProject.mutate({ id: project._id, payload: { completed: false } }),
              },
            }),
        },
      ),
    reopenProject: (id: string) => updateProject.mutate({ id, payload: { completed: false } }),
    deleteProject: (id: string) => deleteProject.mutate(id),
    reorderLists: (kind: "area" | "project", ids: string[]) => reorder.mutate({ kind, ids }),
  };
};

/** Done tasks and projects, newest first, a page at a time. */
export const useLogbook = (scope: LogbookScope = {}, enabled = true) => {
  const api = useTodosApi();
  const query = useInfiniteQuery({
    queryKey: [...queryKeys.todos.logbook(), scope],
    queryFn: ({ pageParam }) => api.fetchLogbook(pageParam, scope),
    enabled,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => {
      const last = page.tasks.at(-1);
      return page.tasks.length >= 60 && last?.completedAt ? last.completedAt : undefined;
    },
  });
  const pages = query.data?.pages ?? [];
  return {
    tasks: pages.flatMap((page) => page.tasks),
    // Projects are only paged with the tasks they finished alongside; dedupe.
    projects: [...new Map(pages.flatMap((page) => page.projects).map((p) => [p._id, p])).values()],
    loading: query.isPending,
    hasMore: query.hasNextPage,
    loadMore: () => void query.fetchNextPage(),
    loadingMore: query.isFetchingNextPage,
  };
};
