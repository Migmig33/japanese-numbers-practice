"use client";

import { useRef } from "react";
import { kanjiNumber } from "@/lib/items";

export type ClockTime = { hour: number; minute: number }; // hour 1–12, minute 0–55 in steps of 5

type Props = {
  value: ClockTime;
  onChange: (t: ClockTime) => void;
  disabled?: boolean;
};

const SIZE = 320;
const C = SIZE / 2;

// Rounded so server and browser trig agree during hydration.
const round2 = (n: number) => Math.round(n * 100) / 100;
const polar = (deg: number, r: number) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [round2(C + r * Math.cos(rad)), round2(C + r * Math.sin(rad))] as const;
};

const wrapHour = (h: number) => ((((h - 1) % 12) + 12) % 12) + 1;
const wrapMinute = (m: number) => ((m % 60) + 60) % 60;

/**
 * A 320px analog clock with draggable hour and minute hands. Minutes snap to 5.
 * Each hand is a focusable slider: arrow keys move it by one hour or five minutes.
 */
export function ClockSet({ value, onChange, disabled = false }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<"hour" | "minute" | null>(null);

  const angleFrom = (e: React.PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * SIZE - C;
    const y = ((e.clientY - r.top) / r.height) * SIZE - C;
    return ((Math.atan2(y, x) * 180) / Math.PI + 90 + 360) % 360;
  };

  const setFromAngle = (hand: "hour" | "minute", deg: number) => {
    if (hand === "minute") onChange({ ...value, minute: wrapMinute(Math.round(deg / 30) * 5) });
    else onChange({ ...value, hour: wrapHour(Math.round(deg / 30) || 12) });
  };

  const onKey = (hand: "hour" | "minute") => (e: React.KeyboardEvent) => {
    if (disabled) return;
    const step = e.key === "ArrowUp" || e.key === "ArrowRight" ? 1 : e.key === "ArrowDown" || e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    if (hand === "hour") onChange({ ...value, hour: wrapHour(value.hour + step) });
    else onChange({ ...value, minute: wrapMinute(value.minute + step * 5) });
  };

  const minuteDeg = value.minute * 6;
  const hourDeg = ((value.hour % 12) + value.minute / 60) * 30;
  const [mx, my] = polar(minuteDeg, 118);
  const [hx, hy] = polar(hourDeg, 78);

  const handProps = (hand: "hour" | "minute") => ({
    role: "slider",
    tabIndex: disabled ? -1 : 0,
    "aria-label": hand === "hour" ? "Hour hand" : "Minute hand",
    "aria-valuemin": hand === "hour" ? 1 : 0,
    "aria-valuemax": hand === "hour" ? 12 : 55,
    "aria-valuenow": hand === "hour" ? value.hour : value.minute,
    "aria-valuetext": hand === "hour" ? `${value.hour} o'clock` : `${value.minute} minutes`,
    "aria-disabled": disabled || undefined,
    onKeyDown: onKey(hand),
    onPointerDown: (e: React.PointerEvent) => {
      if (disabled) return;
      e.stopPropagation();
      dragging.current = hand;
      svgRef.current?.setPointerCapture(e.pointerId);
      (e.currentTarget as SVGGElement).focus();
    },
    className: `outline-none ${disabled ? "" : "cursor-grab"} [&:focus-visible_.hand-focus]:opacity-100`,
  });

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="aspect-square w-full max-w-[320px] touch-none select-none"
      onPointerMove={(e) => dragging.current && setFromAngle(dragging.current, angleFrom(e))}
      onPointerUp={() => (dragging.current = null)}
      onPointerCancel={() => (dragging.current = null)}
      aria-label={`Clock showing ${value.hour}:${String(value.minute).padStart(2, "0")}`}
    >
      <circle cx={C} cy={C} r={154} className="fill-card stroke-primary" strokeWidth={6} />
      {Array.from({ length: 12 }, (_, i) => {
        const [x1, y1] = polar(i * 30, 146);
        const [x2, y2] = polar(i * 30, 134);
        const [tx, ty] = polar(i * 30, 110);
        const n = i === 0 ? 12 : i;
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-ink" strokeWidth={4} strokeLinecap="round" />
            <text
              x={tx}
              y={ty}
              lang="ja"
              textAnchor="middle"
              dominantBaseline="central"
              className="jp fill-ink"
              fontSize={n > 10 ? 19 : 23}
            >
              {kanjiNumber(n)}
            </text>
          </g>
        );
      })}

      <g {...handProps("hour")}>
        <line x1={C} y1={C} x2={hx} y2={hy} stroke="transparent" strokeWidth={34} strokeLinecap="round" />
        <line x1={C} y1={C} x2={hx} y2={hy} className="hand-focus stroke-accent opacity-0" strokeWidth={18} strokeLinecap="round" />
        <line x1={C} y1={C} x2={hx} y2={hy} className="stroke-ink" strokeWidth={10} strokeLinecap="round" />
      </g>
      <g {...handProps("minute")}>
        <line x1={C} y1={C} x2={mx} y2={my} stroke="transparent" strokeWidth={30} strokeLinecap="round" />
        <line x1={C} y1={C} x2={mx} y2={my} className="hand-focus stroke-accent opacity-0" strokeWidth={14} strokeLinecap="round" />
        <line x1={C} y1={C} x2={mx} y2={my} className="stroke-primary" strokeWidth={6} strokeLinecap="round" />
      </g>
      <circle cx={C} cy={C} r={9} className="fill-accent" />
    </svg>
  );
}
