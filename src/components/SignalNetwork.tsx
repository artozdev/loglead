"use client";

// ---------------------------------------------------------------------------
// SignalNetwork — the recurring LogLead brand element. An abstract data network
// of prospects / companies / content / signals that converge toward a single
// "opportunity" node. Pure SVG + CSS (no deps); animations are gated behind
// prefers-reduced-motion in globals.css. Used in the hero, the Signals section
// and the final CTA.
// ---------------------------------------------------------------------------

type Node = { id: string; x: number; y: number; r: number; hub?: boolean; delay: number };
type Edge = { from: string; to: string; delay: number };

// Fixed layout in a 480×320 viewBox — sources on the left feeding a hub on the right.
const NODES: Node[] = [
  { id: "a", x: 46, y: 60, r: 4, delay: 0 },
  { id: "b", x: 70, y: 150, r: 5, delay: 0.4 },
  { id: "c", x: 40, y: 238, r: 4, delay: 0.8 },
  { id: "d", x: 150, y: 100, r: 5, delay: 0.6 },
  { id: "e", x: 168, y: 210, r: 4, delay: 1.0 },
  { id: "f", x: 250, y: 62, r: 4, delay: 1.2 },
  { id: "g", x: 268, y: 158, r: 6, delay: 0.5 },
  { id: "h", x: 258, y: 252, r: 4, delay: 1.4 },
  { id: "hub", x: 410, y: 160, r: 11, hub: true, delay: 0 },
];

const EDGES: Edge[] = [
  { from: "a", to: "d", delay: 0.1 },
  { from: "b", to: "d", delay: 0.3 },
  { from: "b", to: "g", delay: 0.5 },
  { from: "c", to: "e", delay: 0.7 },
  { from: "d", to: "f", delay: 0.9 },
  { from: "d", to: "g", delay: 0.4 },
  { from: "e", to: "g", delay: 1.1 },
  { from: "h", to: "g", delay: 1.3 },
  { from: "f", to: "hub", delay: 1.0 },
  { from: "g", to: "hub", delay: 0.8 },
  { from: "e", to: "hub", delay: 1.5 },
];

const byId = (id: string) => NODES.find((n) => n.id === id)!;

export default function SignalNetwork({
  className = "",
  animate = true,
}: {
  className?: string;
  animate?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 480 320"
      className={`sn-root ${animate ? "sn-on" : ""} ${className}`}
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id="sn-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0051FF" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0051FF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sn-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0051FF" stopOpacity="0" />
          <stop offset="50%" stopColor="#0051FF" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#0051FF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Edges */}
      {EDGES.map((e, i) => {
        const a = byId(e.from);
        const b = byId(e.to);
        return (
          <g key={i}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#E2E8F0" strokeWidth="1" />
            <line
              className="sn-edge"
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="url(#sn-line)"
              strokeWidth="1.5"
              strokeLinecap="round"
              style={{ animationDelay: `${e.delay}s` }}
            />
          </g>
        );
      })}

      {/* Nodes */}
      {NODES.map((n) => (
        <g key={n.id} style={{ animationDelay: `${n.delay}s` }} className="sn-node">
          <circle cx={n.x} cy={n.y} r={n.r * 4} fill="url(#sn-halo)" className="sn-halo" />
          <circle
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill={n.hub ? "#0051FF" : "#FFFFFF"}
            stroke="#0051FF"
            strokeWidth={n.hub ? 0 : 1.5}
          />
          {n.hub && <circle cx={n.x} cy={n.y} r={n.r + 6} stroke="#0051FF" strokeOpacity="0.3" strokeWidth="1.5" className="sn-pulse" />}
        </g>
      ))}
    </svg>
  );
}
