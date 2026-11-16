import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLongPress } from "./useLongPress";

function Row({ onHold, onTap, onRelease = false }: { onHold: () => void; onTap: () => void; onRelease?: boolean }) {
  const longPress = useLongPress(onHold, { onRelease });
  return (
    <div role="button" onClick={onTap} {...longPress}>
      row
    </div>
  );
}

const press = (pointerType: string, x = 10, y = 10) =>
  fireEvent.pointerDown(screen.getByRole("button"), { pointerType, isPrimary: true, clientX: x, clientY: y });

describe("useLongPress", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("fires after a still touch hold and swallows the click that follows", () => {
    const onHold = vi.fn();
    const onTap = vi.fn();
    render(<Row onHold={onHold} onTap={onTap} />);
    press("touch");
    act(() => vi.advanceTimersByTime(500));
    expect(onHold).toHaveBeenCalledOnce();
    fireEvent.pointerUp(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("button"));
    expect(onTap).not.toHaveBeenCalled();
  });

  it("leaves a quick tap alone", () => {
    const onHold = vi.fn();
    const onTap = vi.fn();
    render(<Row onHold={onHold} onTap={onTap} />);
    press("touch");
    act(() => vi.advanceTimersByTime(100));
    fireEvent.pointerUp(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("button"));
    act(() => vi.advanceTimersByTime(1000));
    expect(onHold).not.toHaveBeenCalled();
    expect(onTap).toHaveBeenCalledOnce();
  });

  it("ignores the mouse and a finger that moves", () => {
    const onHold = vi.fn();
    render(<Row onHold={onHold} onTap={() => undefined} />);
    press("mouse");
    act(() => vi.advanceTimersByTime(1000));
    press("touch");
    fireEvent.pointerMove(screen.getByRole("button"), { clientX: 10, clientY: 40 });
    act(() => vi.advanceTimersByTime(1000));
    expect(onHold).not.toHaveBeenCalled();
  });

  it("in release mode, fires when a long still press is lifted", () => {
    const onHold = vi.fn();
    render(<Row onHold={onHold} onTap={() => undefined} onRelease />);
    press("touch");
    act(() => vi.advanceTimersByTime(600));
    expect(onHold).not.toHaveBeenCalled();
    fireEvent.pointerUp(screen.getByRole("button"));
    expect(onHold).toHaveBeenCalledOnce();
  });
});
