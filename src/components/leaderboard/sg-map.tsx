"use client";

import { useMemo } from "react";
import { Crown } from "lucide-react";
import { cn } from "@/lib/cn";
import { areas } from "@/lib/data/taxonomy";
import type { AreaId, User } from "@/lib/types";
import { UserAvatar } from "../ui/avatar";

/** Framing tuned to the main island so it fills the card. */
const B = { west: 103.585, east: 104.075, south: 1.235, north: 1.478 };
const W = 800;
const H = Math.round((W * (B.north - B.south)) / (B.east - B.west));

const proj = (lng: number, lat: number): [number, number] => [
  ((lng - B.west) / (B.east - B.west)) * W,
  ((B.north - lat) / (B.north - B.south)) * H,
];

/** Coarse outline of the main island (lng, lat), clockwise from the west. */
const ISLAND: [number, number][] = [
  [103.615, 1.3], [103.625, 1.268], [103.66, 1.262], [103.7, 1.272], [103.74, 1.28], [103.77, 1.277], [103.795, 1.266], [103.83, 1.262],
  [103.855, 1.268], [103.87, 1.283], [103.885, 1.296], [103.92, 1.3], [103.96, 1.309], [104.0, 1.32], [104.025, 1.34], [104.04, 1.37],
  [104.03, 1.392], [103.99, 1.395], [103.95, 1.386], [103.925, 1.405], [103.912, 1.428], [103.885, 1.44], [103.855, 1.452], [103.825, 1.466],
  [103.79, 1.458], [103.765, 1.446], [103.74, 1.438], [103.705, 1.446], [103.668, 1.434], [103.64, 1.395], [103.625, 1.345],
];

/** Closed Catmull-Rom → cubic Bézier, for a soft coastline. */
function smooth(points: [number, number][]): string {
  const n = points.length;
  const p = (i: number) => points[(i + n) % n];
  let d = `M ${p(0)[0].toFixed(1)} ${p(0)[1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = p(i - 1), p1 = p(i), p2 = p(i + 1), p3 = p(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + " Z";
}

const ISLAND_PATH = smooth(ISLAND.map(([lng, lat]) => proj(lng, lat)));
const SENTOSA = smooth([[103.81, 1.252], [103.835, 1.246], [103.855, 1.25], [103.835, 1.258]].map(([a, b]) => proj(a, b)));
const UBIN = smooth([[103.94, 1.402], [103.975, 1.405], [103.985, 1.416], [103.95, 1.418]].map(([a, b]) => proj(a, b)));
const JURONG_IS = smooth([[103.69, 1.262], [103.72, 1.256], [103.735, 1.268], [103.705, 1.274]].map(([a, b]) => proj(a, b)));

/** Nudge bubbles apart (deterministic) so central areas don't stack. */
function relax(seed: { id: AreaId; x: number; y: number }[], minDist = 92): Map<AreaId, [number, number]> {
  const pts = seed.map((s) => ({ ...s }));
  for (let it = 0; it < 80; it++) {
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[j].x - pts[i].x;
        const dy = (pts[j].y - pts[i].y) * 1.35;
        const d = Math.hypot(dx, dy) || 0.01;
        if (d < minDist) {
          const push = (minDist - d) / 2;
          const ux = dx / d, uy = dy / d;
          pts[i].x -= ux * push; pts[j].x += ux * push;
          pts[i].y -= (uy * push) / 1.35; pts[j].y += (uy * push) / 1.35;
        }
      }
      pts[i].x = Math.max(56, Math.min(W - 56, pts[i].x));
      pts[i].y = Math.max(26, Math.min(H - 26, pts[i].y));
    }
  }
  return new Map(pts.map((p) => [p.id, [p.x, p.y]]));
}

const POS = relax(areas.map((a) => ({ id: a.id, ...(([x, y]) => ({ x, y }))(proj(a.lng, a.lat)) })));

export interface AreaLeader {
  areaId: AreaId;
  user: User;
  points: number;
}

/**
 * A stylised map of Singapore: each neighbourhood is a bubble showing its top
 * finder and their points. Buttons, so it is fully keyboard + screen-reader operable.
 */
export function AreaMap({
  leaders,
  selected,
  onSelect,
  meId,
}: {
  leaders: AreaLeader[];
  selected: AreaId;
  onSelect: (id: AreaId) => void;
  meId?: string;
}) {
  const topAreaId = useMemo(() => [...leaders].sort((a, b) => b.points - a.points)[0]?.areaId, [leaders]);
  return (
    <div className="relative overflow-hidden rounded-card bg-gradient-to-b from-sky to-[#dce8fb] shadow-soft">
      <div className="relative mx-auto" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <linearGradient id="island" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f6f9f2" />
              <stop offset="1" stopColor="#e8f0e3" />
            </linearGradient>
          </defs>
          <path d={ISLAND_PATH} fill="url(#island)" stroke="#ffffff" strokeWidth="6" strokeLinejoin="round" />
          <path d={ISLAND_PATH} fill="none" stroke="#c8d8ee" strokeWidth="1.5" strokeLinejoin="round" />
          {[SENTOSA, UBIN, JURONG_IS].map((d, i) => (
            <path key={i} d={d} fill="#eef4ea" stroke="#fff" strokeWidth="3" />
          ))}
          {[[310, 170, 26], [560, 120, 18], [180, 260, 20], [620, 260, 22], [440, 240, 16]].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="#d9ead0" opacity=".7" />
          ))}
        </svg>

        {leaders.map((l) => {
          const [x, y] = POS.get(l.areaId) ?? [0, 0];
          const area = areas.find((a) => a.id === l.areaId)!;
          const on = selected === l.areaId;
          const isTop = l.areaId === topAreaId;
          return (
            <button
              key={l.areaId}
              type="button"
              onClick={() => onSelect(l.areaId)}
              aria-pressed={on}
              aria-label={`${area.name}: top finder ${l.user.name}, ${l.points} points`}
              className={cn(
                "absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-white py-1 pl-1 pr-2.5 text-left shadow-lift ring-1 ring-line transition-all hover:z-20 hover:scale-105 max-sm:pr-1.5",
                on ? "z-20 scale-110 bg-coral-50 ring-2 ring-coral-500" : "z-10",
              )}
              style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` }}
            >
              <span className="relative">
                <UserAvatar user={l.user} size="xs" ring={l.user.id === meId ? "coral" : "none"} />
                {isTop && <Crown className="absolute -right-1.5 -top-2 size-3.5 fill-gold-400 text-gold-500" aria-hidden />}
              </span>
              <span className="leading-none max-sm:hidden">
                <span className={cn("block text-[0.62rem] font-bold", on ? "text-coral-700" : "text-navy-500")}>{area.name}</span>
                <span className="block text-[0.82rem] font-extrabold tabular-nums text-navy-900">{l.points}</span>
              </span>
              <span className="text-[0.7rem] font-extrabold tabular-nums text-navy-900 sm:hidden">{l.points}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
