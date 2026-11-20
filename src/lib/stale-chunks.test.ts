import { afterEach, describe, expect, it, vi } from "vitest";
import { isStaleChunkError, reloadForNewBuild } from "./stale-chunks";

describe("stale chunks", () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("recognises the errors a replaced build file gives", () => {
    expect(
      isStaleChunkError(new TypeError("'text/html' is not a valid JavaScript MIME type for module script 'https://x/assets/TodosLayout-COSJeOaK.js'.")),
    ).toBe(true);
    expect(isStaleChunkError(new TypeError("Failed to fetch dynamically imported module: https://x/a.js"))).toBe(true);
    expect(isStaleChunkError(new Error("Cannot read properties of undefined"))).toBe(false);
  });

  it("reloads only once in a short window", () => {
    const reload = vi.fn();
    vi.spyOn(window, "location", "get").mockReturnValue({ ...window.location, reload } as Location);
    expect(reloadForNewBuild()).toBe(true);
    expect(reloadForNewBuild()).toBe(false);
    expect(reload).toHaveBeenCalledOnce();
  });
});
