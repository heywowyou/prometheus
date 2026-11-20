import { PointerSensor, type PointerSensorOptions } from "@dnd-kit/core";
import type { PointerEvent as ReactPointerEvent } from "react";

/**
 * PointerSensor for the mouse and pen only. Touches also send pointer events,
 * and they arrive before touch events, so a plain PointerSensor would claim
 * every finger and the TouchSensor's press-and-hold would never run. Pair this
 * with a TouchSensor (with a delay) for phones.
 */
export class MouseSensor extends PointerSensor {
  static override activators = [
    {
      eventName: "onPointerDown" as const,
      handler: ({ nativeEvent: event }: ReactPointerEvent, { onActivation }: PointerSensorOptions) => {
        if (!event.isPrimary || event.button !== 0 || event.pointerType === "touch") return false;
        onActivation?.({ event });
        return true;
      },
    },
  ];
}
