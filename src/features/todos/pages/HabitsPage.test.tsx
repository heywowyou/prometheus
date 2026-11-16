import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../../test/server";
import { renderWithApp } from "../../../test/render";
import { habit } from "../../../test/fixtures";
import type { Todo } from "../types/todo-types";
import HabitsPage from "./HabitsPage";

vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => ({ isLoaded: true, isSignedIn: true, getToken: async () => "token" }),
  useUser: () => ({ isLoaded: true, user: { firstName: "Jules" } }),
}));

const serve = (todos: Todo[]) => {
  server.use(
    http.get("/api/todos", ({ request }) =>
      HttpResponse.json(new URL(request.url).searchParams.get("paused") === "true" ? [] : todos),
    ),
    http.get("/api/todos/habits/completions", () => HttpResponse.json({ habits: [], totals: [] })),
    http.patch("/api/todos/:id/skip", ({ params }) => {
      const todo = todos.find((item) => item._id === params.id) as Todo;
      todo.skipped = !todo.skipped;
      return HttpResponse.json(todo);
    }),
  );
};

const dailyRows = async () => {
  const section = (await screen.findByRole("heading", { name: "Daily" })).closest("section") as HTMLElement;
  return within(section)
    .getAllByRole("button", { name: /^(Complete|Mark not done): / })
    .map((button) => button.getAttribute("aria-label")?.replace(/^(Complete|Mark not done): /, ""));
};

describe("HabitsPage", () => {
  it("lists habits in their saved order, done ones in place", async () => {
    serve([
      habit("a", "Read", { order: 2 }),
      habit("b", "Gym", { order: 0, completed: true }),
      habit("c", "Stretch", { order: 1 }),
    ]);
    renderWithApp(<HabitsPage />);
    expect(await dailyRows()).toEqual(["Gym", "Stretch", "Read"]);
  });

  it("skips a habit for today from its menu, without marking it done", async () => {
    const user = userEvent.setup();
    serve([habit("a", "Gym", { order: 0 }), habit("b", "Read", { order: 1 })]);
    renderWithApp(<HabitsPage />);

    await user.click(await screen.findByRole("button", { name: "Actions for Gym" }));
    await user.click(await screen.findByRole("menuitem", { name: "Skip today" }));

    expect(await screen.findByText("Rest day")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Complete: Gym" })).toHaveAttribute("aria-pressed", "false");
    // A rest day is out of the day's tally: 0 of 1 (Read), not 0 of 2.
    expect(screen.getByText("0 of 1 done today")).toBeInTheDocument();
  });

  it("shows progress for a few-days-a-week habit", async () => {
    serve([habit("a", "Gym", { order: 0, perWeek: 5, thisWeek: 2 })]);
    renderWithApp(<HabitsPage />);
    expect(await screen.findByText("2 of 5 this week")).toBeInTheDocument();
  });
});
