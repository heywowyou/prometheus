import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const coarse = (matches: boolean) =>
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );

/** A fresh module each time: the enabled flag is cached per load. */
const load = async () => {
  vi.resetModules();
  return import("./haptics");
};

describe("haptics", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, "vibrate");
    Reflect.deleteProperty(navigator, "userActivation");
  });

  it("vibrates on Android with the kind's pattern", async () => {
    coarse(true);
    const vibrate = vi.fn(() => true);
    Object.defineProperty(navigator, "vibrate", { value: vibrate, configurable: true });
    const { haptic } = await load();
    haptic("success");
    expect(vibrate).toHaveBeenCalledWith([12, 60, 18]);
  });

  it("stays silent on desktop and when turned off", async () => {
    const vibrate = vi.fn(() => true);
    Object.defineProperty(navigator, "vibrate", { value: vibrate, configurable: true });
    coarse(false);
    let module = await load();
    module.haptic("light");
    expect(vibrate).not.toHaveBeenCalled();

    coarse(true);
    localStorage.setItem("haptics", "off");
    module = await load();
    module.haptic("light");
    expect(vibrate).not.toHaveBeenCalled();
  });

  it("clicks a hidden switch on iPhone, and waits for the finger to lift without a gesture", async () => {
    coarse(true);
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)");
    const activation = { isActive: true };
    Object.defineProperty(navigator, "userActivation", { value: activation, configurable: true });
    const { haptic } = await load();

    haptic("light");
    const input = document.querySelector<HTMLInputElement>("input[switch]");
    expect(input).not.toBeNull();
    expect(input?.checked).toBe(true);

    activation.isActive = false;
    haptic("hold");
    expect(input?.checked).toBe(true);
    window.dispatchEvent(new Event("touchend"));
    expect(input?.checked).toBe(false);
  });
});
