import { fireEvent, render, screen } from "@testing-library/react";
import { Check, Shredder } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { ActionSheet } from "./action-sheet";

function Harness({ onRow, onDone, onDelete }: { onRow: () => void; onDone: () => void; onDelete: () => void }) {
  return (
    // The row that opened the sheet: it must not hear the sheet's clicks.
    <div onClick={onRow}>
      <ActionSheet
        open
        onOpenChange={() => undefined}
        title="Read"
        description="Every day"
        actions={[
          { key: "done", label: "Mark done", icon: Check, onSelect: onDone },
          { key: "delete", label: "Delete", icon: Shredder, destructive: true, onSelect: onDelete },
        ]}
      />
    </div>
  );
}

describe("ActionSheet", () => {
  it("keeps its clicks from reaching the row behind it", () => {
    const onRow = vi.fn();
    render(<Harness onRow={onRow} onDone={() => undefined} onDelete={() => undefined} />);
    fireEvent.click(screen.getByText("Mark done"));
    expect(onRow).not.toHaveBeenCalled();
  });

  it("asks for a second tap before a destructive action", () => {
    render(<Harness onRow={() => undefined} onDone={() => undefined} onDelete={() => undefined} />);
    fireEvent.click(screen.getByText("Delete"));
    expect(screen.getByText("Tap again to delete")).toBeTruthy();
  });

  it("shows the description under the title", () => {
    render(<Harness onRow={() => undefined} onDone={() => undefined} onDelete={() => undefined} />);
    expect(screen.getByText("Every day")).toBeTruthy();
  });
});
