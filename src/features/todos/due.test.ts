import { describe, expect, it } from "vitest";
import { habit } from "../../test/fixtures";
import { compareSectionTodos } from "./due";

const sortIds = (items: ReturnType<typeof habit>[]) => [...items].sort(compareSectionTodos).map((todo) => todo._id);

describe("compareSectionTodos", () => {
  it("follows the dragged order", () => {
    const items = [habit("a", "Read", { order: 2 }), habit("b", "Gym", { order: 0 }), habit("c", "Stretch", { order: 1 })];
    expect(sortIds(items)).toEqual(["b", "c", "a"]);
  });

  it("ignores whether a habit is done", () => {
    const items = [habit("a", "Read", { order: 0, completed: true }), habit("b", "Gym", { order: 1 })];
    expect(sortIds(items)).toEqual(["a", "b"]);
  });

  it("gives the same order whatever the input order when positions tie", () => {
    const one = habit("a", "Zen", { order: 0 });
    const two = habit("b", "Art", { order: 0 });
    expect(sortIds([one, two])).toEqual(sortIds([two, one]));
    expect(sortIds([one, two])).toEqual(["b", "a"]);
  });

  it("puts never-placed items first", () => {
    const items = [habit("a", "Read", { order: 0 }), habit("b", "Gym")];
    expect(sortIds(items)).toEqual(["b", "a"]);
  });
});
