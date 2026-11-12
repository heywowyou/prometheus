import { useEffect, useMemo, useRef, useState } from "react";

export interface ChartPoint {
  date: string;
  value: number;
}

interface ProgressChartProps {
  points: ChartPoint[];
  format: (value: number) => string;
  /** Pace: lower is better, so the axis is flipped to keep "up = better". */
  invert?: boolean;
  height?: number;
}

const PAD = { top: 16, right: 12, bottom: 22, left: 12 };

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });

/**
 * A small responsive line chart (hand-rolled SVG; no chart library). Tap or
 * hover a point to read it; the latest point is labelled by default.
 */
function ProgressChart({ points, format, invert = false, height = 180 }: ProgressChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const geometry = useMemo(() => {
    if (width === 0 || points.length === 0) return null;
    const values = points.map((p) => p.value);
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (min === max) {
      min -= 1;
      max += 1;
    }
    const innerW = width - PAD.left - PAD.right;
    const innerH = height - PAD.top - PAD.bottom;
    const xs = points.map((_, i) =>
      points.length === 1 ? PAD.left + innerW / 2 : PAD.left + (i / (points.length - 1)) * innerW,
    );
    const ys = values.map((v) => {
      const t = (v - min) / (max - min);
      return PAD.top + (invert ? t : 1 - t) * innerH;
    });
    const line = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${(ys[i] as number).toFixed(1)}`).join(" ");
    const baseline = PAD.top + innerH;
    const area = `${line} L${(xs[xs.length - 1] as number).toFixed(1)},${baseline} L${(xs[0] as number).toFixed(1)},${baseline} Z`;
    return { xs, ys, line, area };
  }, [points, width, height, invert]);

  const active = selected ?? points.length - 1;
  const activePoint = points[active];

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height }}>
      {geometry && activePoint && (
        <svg
          width={width}
          height={height}
          className="overflow-visible"
          onPointerLeave={() => setSelected(null)}
          onPointerMove={(event) => {
            const x = event.nativeEvent.offsetX;
            let nearest = 0;
            geometry.xs.forEach((px, i) => {
              if (Math.abs(px - x) < Math.abs((geometry.xs[nearest] as number) - x)) nearest = i;
            });
            setSelected(nearest);
          }}
        >
          <path d={geometry.area} className="fill-rating/10" />
          <path
            d={geometry.line}
            className="fill-none stroke-rating"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {points.length <= 40 &&
            geometry.xs.map((x, i) => (
              <circle
                key={i}
                cx={x}
                cy={geometry.ys[i]}
                r={i === active ? 5 : 3}
                className={i === active ? "fill-rating" : "fill-card stroke-rating"}
                strokeWidth={1.5}
              />
            ))}
          <line
            x1={geometry.xs[active]}
            x2={geometry.xs[active]}
            y1={PAD.top}
            y2={height - PAD.bottom}
            className="stroke-border"
            strokeDasharray="3 3"
          />
          <text x={PAD.left} y={height - 6} className="fill-muted-foreground text-[10px]">
            {shortDate(points[0]?.date ?? "")}
          </text>
          {points.length > 1 && (
            <text
              x={width - PAD.right}
              y={height - 6}
              textAnchor="end"
              className="fill-muted-foreground text-[10px]"
            >
              {shortDate(points[points.length - 1]?.date ?? "")}
            </text>
          )}
        </svg>
      )}
      {activePoint && geometry && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-0.5 text-xs text-popover-foreground"
          style={{
            left: Math.min(Math.max(geometry.xs[active] as number, 50), width - 50),
          }}
        >
          <span className="font-semibold tabular-nums">{format(activePoint.value)}</span>
          <span className="text-muted-foreground"> · {shortDate(activePoint.date)}</span>
        </div>
      )}
    </div>
  );
}

export default ProgressChart;
