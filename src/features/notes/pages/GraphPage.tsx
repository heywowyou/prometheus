import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { Switch } from "@components/ui/switch";
import { cn } from "@lib/utils";
import { useNoteIndex } from "../hooks/useNotes";
import { dailyTitle, titleOf } from "../note-tree";

interface GraphNode extends SimulationNodeDatum {
  id: string;
  label: string;
  degree: number;
  daily: boolean;
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  kind: "link" | "parent";
}

const WIDTH = 1000;
const HEIGHT = 680;
const radiusOf = (node: GraphNode) => 4 + Math.min(10, Math.sqrt(node.degree) * 2.4);
const endId = (end: string | number | GraphNode) => (typeof end === "object" ? end.id : String(end));

/** Obsidian-style graph: pages are dots, [[links]] are lines, sub-pages hang off dashed lines. */
export default function GraphPage() {
  const navigate = useNavigate();
  const { entries, loading } = useNoteIndex();
  const [showOrphans, setShowOrphans] = useState(true);
  const [showHierarchy, setShowHierarchy] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [, setFrame] = useState(0);
  const simulation = useRef<Simulation<GraphNode, GraphLink> | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ node?: GraphNode; panFrom?: { x: number; y: number; vx: number; vy: number }; moved: boolean } | null>(null);

  const graph = useMemo(() => {
    const live = entries.filter((entry) => !entry.isTemplate);
    const ids = new Set(live.map((entry) => entry._id));
    const links: GraphLink[] = [];
    const seen = new Set<string>();
    for (const entry of live) {
      for (const target of entry.links) {
        if (!ids.has(target) || target === entry._id) continue;
        const key = [entry._id, target].sort().join(":");
        if (seen.has(key)) continue;
        seen.add(key);
        links.push({ source: entry._id, target, kind: "link" });
      }
      if (showHierarchy && entry.parentId && ids.has(entry.parentId)) {
        links.push({ source: entry.parentId, target: entry._id, kind: "parent" });
      }
    }
    const degree = new Map<string, number>();
    for (const link of links) {
      for (const end of [link.source, link.target]) {
        const id = endId(end);
        degree.set(id, (degree.get(id) ?? 0) + 1);
      }
    }
    const nodes: GraphNode[] = live
      .filter((entry) => showOrphans || degree.has(entry._id))
      .map((entry) => ({
        id: entry._id,
        label: entry.dailyDate ? dailyTitle(entry.dailyDate) : titleOf(entry),
        degree: degree.get(entry._id) ?? 0,
        daily: Boolean(entry.dailyDate),
      }));
    return { nodes, links };
  }, [entries, showOrphans, showHierarchy]);

  const neighbors = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const link of graph.links) {
      const a = endId(link.source);
      const b = endId(link.target);
      if (!map.has(a)) map.set(a, new Set());
      if (!map.has(b)) map.set(b, new Set());
      map.get(a)?.add(b);
      map.get(b)?.add(a);
    }
    return map;
  }, [graph.links]);

  useEffect(() => {
    const sim = forceSimulation<GraphNode, GraphLink>(graph.nodes)
      .force(
        "link",
        forceLink<GraphNode, GraphLink>(graph.links)
          .id((node) => node.id)
          .distance((link) => (link.kind === "parent" ? 50 : 80))
          .strength((link) => (link.kind === "parent" ? 0.5 : 0.35)),
      )
      .force("charge", forceManyBody().strength(-220))
      .force("center", forceCenter(WIDTH / 2, HEIGHT / 2))
      .force("x", forceX(WIDTH / 2).strength(0.04))
      .force("y", forceY(HEIGHT / 2).strength(0.06))
      .force("collide", forceCollide<GraphNode>().radius((node) => radiusOf(node) + 4));
    let raf = 0;
    sim.on("tick", () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setFrame((frame) => frame + 1));
    });
    simulation.current = sim;
    return () => {
      cancelAnimationFrame(raf);
      sim.stop();
    };
  }, [graph]);

  /** Pointer position in graph coordinates. */
  const toGraph = (event: React.PointerEvent | React.WheelEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const sx = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const sy = ((event.clientY - rect.top) / rect.height) * HEIGHT;
    return { x: (sx - view.x) / view.k, y: (sy - view.y) / view.k, sx, sy };
  };

  const zoomBy = (factor: number, origin = { sx: WIDTH / 2, sy: HEIGHT / 2 }) =>
    setView((current) => {
      const k = Math.min(4, Math.max(0.3, current.k * factor));
      const ratio = k / current.k;
      return { k, x: origin.sx - (origin.sx - current.x) * ratio, y: origin.sy - (origin.sy - current.y) * ratio };
    });

  const onPointerDown = (event: React.PointerEvent, node?: GraphNode) => {
    event.stopPropagation();
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
    if (node) {
      drag.current = { node, moved: false };
      simulation.current?.alphaTarget(0.25).restart();
      const point = toGraph(event);
      node.fx = point.x;
      node.fy = point.y;
    } else {
      const { sx = 0, sy = 0 } = toGraph(event) as { sx?: number; sy?: number };
      drag.current = { panFrom: { x: sx, y: sy, vx: view.x, vy: view.y }, moved: false };
    }
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const state = drag.current;
    if (!state) return;
    state.moved = true;
    const point = toGraph(event) as { x: number; y: number; sx: number; sy: number };
    if (state.node) {
      state.node.fx = point.x;
      state.node.fy = point.y;
    } else if (state.panFrom) {
      const { x, y, vx, vy } = state.panFrom;
      setView((current) => ({ ...current, x: vx + point.sx - x, y: vy + point.sy - y }));
    }
  };

  const onPointerUp = () => {
    const state = drag.current;
    drag.current = null;
    if (!state?.node) return;
    simulation.current?.alphaTarget(0);
    state.node.fx = null;
    state.node.fy = null;
    if (!state.moved) navigate(`/notes/${state.node.id}`);
  };

  const active = hovered ? neighbors.get(hovered) ?? new Set<string>() : null;
  const isLit = (id: string) => !active || id === hovered || active.has(id);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="eyebrow">Notes</p>
          <h1 className="page-title">Graph</h1>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-soft">
          <label className="flex items-center gap-2">
            <Switch checked={showHierarchy} onCheckedChange={setShowHierarchy} /> Sub-pages
          </label>
          <label className="flex items-center gap-2">
            <Switch checked={showOrphans} onCheckedChange={setShowOrphans} /> Unlinked pages
          </label>
        </div>
      </header>

      <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
        {!loading && graph.nodes.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
            Link pages with [[ to see them connect here.
          </p>
        )}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="block h-[min(70vh,680px)] w-full cursor-grab touch-none select-none active:cursor-grabbing"
          onPointerDown={(event) => onPointerDown(event)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={(event) => {
            const { sx = 0, sy = 0 } = toGraph(event) as { sx?: number; sy?: number };
            zoomBy(event.deltaY < 0 ? 1.12 : 1 / 1.12, { sx, sy });
          }}
        >
          <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
            {graph.links.map((link, index) => {
              const source = link.source as GraphNode;
              const target = link.target as GraphNode;
              if (source.x === undefined || target.x === undefined) return null;
              const lit = !active || source.id === hovered || target.id === hovered;
              return (
                <line
                  key={index}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  className={cn(
                    "transition-opacity",
                    lit && active ? "stroke-rating" : "stroke-muted-foreground",
                  )}
                  strokeOpacity={lit ? (active ? 0.9 : 0.35) : 0.06}
                  strokeWidth={1 / Math.sqrt(view.k)}
                  strokeDasharray={link.kind === "parent" ? "3 3" : undefined}
                />
              );
            })}
            {graph.nodes.map((node) => {
              if (node.x === undefined || node.y === undefined) return null;
              const lit = isLit(node.id);
              const showLabel = node.id === hovered || (lit && active) || view.k > 1.4 || node.degree >= 4 || graph.nodes.length <= 40;
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x} ${node.y})`}
                  className="cursor-pointer"
                  opacity={lit ? 1 : 0.15}
                  onPointerDown={(event) => onPointerDown(event, node)}
                  onPointerEnter={() => setHovered(node.id)}
                  onPointerLeave={() => setHovered((current) => (current === node.id ? null : current))}
                >
                  <circle
                    r={radiusOf(node)}
                    className={cn(
                      node.id === hovered ? "fill-rating" : node.daily ? "fill-info" : "fill-soft",
                    )}
                  />
                  {showLabel && (
                    <text
                      y={radiusOf(node) + 13}
                      textAnchor="middle"
                      className="pointer-events-none fill-foreground text-[11px]"
                      style={{ fontSize: 11 / Math.sqrt(view.k) }}
                    >
                      {node.label.length > 32 ? `${node.label.slice(0, 31)}…` : node.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full border border-border bg-background/80 p-1 backdrop-blur">
          {[
            { label: "Zoom out", icon: Minus, run: () => zoomBy(1 / 1.25) },
            { label: "Reset view", icon: RotateCcw, run: () => setView({ x: 0, y: 0, k: 1 }) },
            { label: "Zoom in", icon: Plus, run: () => zoomBy(1.25) },
          ].map(({ label, icon: Icon, run }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              onClick={run}
              className="flex h-8 w-8 items-center justify-center rounded-full text-soft hover:bg-secondary hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Drag to pan, scroll to zoom, hover a page to see its neighbors, click to open it. Blue dots are journal days.
      </p>
    </div>
  );
}
