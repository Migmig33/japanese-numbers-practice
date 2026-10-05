"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KanjiGuide, Point } from "@/lib/strokes";

const SIZE = 420;
const S = SIZE / 100; // guide units → canvas px

const DOT_GAP = 9; // guide units; dots have a 12px radius

/**
 * Where to draw each stroke's number. Strokes that start where an earlier one did
 * (四's first two, say) get their dot nudged a little way along their own path.
 */
function dotPositions(guide: KanjiGuide): Point[] {
  const placed: Point[] = [];
  for (const s of guide.strokes) {
    let [x, y] = s[0]!;
    const [nx, ny] = s[1]!;
    if (placed.some(([px, py]) => Math.hypot(px - x, py - y) < DOT_GAP)) {
      const len = Math.hypot(nx - x, ny - y) || 1;
      x += ((nx - x) / len) * DOT_GAP;
      y += ((ny - y) / len) * DOT_GAP;
    }
    placed.push([x, y]);
  }
  return placed;
}

function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim();
}

/**
 * Tracing pad: the character as a pale ghost with numbered stroke starts. Captures
 * mouse, touch and pen strokes and counts them. Stroke order isn't checked — the
 * learner compares against the ghost.
 */
export function TraceCanvas({ guide }: { guide: KanjiGuide }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const drawing = useRef<Point[] | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== SIZE * dpr) {
      canvas.width = SIZE * dpr;
      canvas.height = SIZE * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Guide cross.
    ctx.strokeStyle = token("hairline");
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(SIZE / 2, 0);
    ctx.lineTo(SIZE / 2, SIZE);
    ctx.moveTo(0, SIZE / 2);
    ctx.lineTo(SIZE, SIZE / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Ghost.
    ctx.strokeStyle = token("hairline");
    ctx.lineWidth = 30;
    for (const s of guide.strokes) {
      ctx.beginPath();
      s.forEach(([x, y], i) => (i ? ctx.lineTo(x * S, y * S) : ctx.moveTo(x * S, y * S)));
      ctx.stroke();
    }

    // User strokes.
    ctx.strokeStyle = token("primary");
    ctx.lineWidth = 14;
    for (const s of [...strokes, ...(drawing.current ? [drawing.current] : [])]) {
      ctx.beginPath();
      s.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      if (s.length === 1) ctx.lineTo(s[0]![0] + 0.1, s[0]![1]);
      ctx.stroke();
    }

    // Numbered stroke starts, drawn last so they stay visible.
    ctx.font = `700 14px ${getComputedStyle(document.body).fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    dotPositions(guide).forEach(([x, y], i) => {
      ctx.fillStyle = token("accent");
      ctx.beginPath();
      ctx.arc(x * S, y * S, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = token("ink");
      ctx.fillText(String(i + 1), x * S, y * S + 1);
    });
  }, [guide, strokes]);

  useEffect(draw, [draw]);

  const toPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const r = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * SIZE, ((e.clientY - r.top) / r.height) * SIZE];
  };

  const expected = guide.strokes.length;
  const n = strokes.length;
  const status =
    n === 0
      ? `Start at stroke 1 and follow the numbers.`
      : n < expected
        ? `Next: stroke ${n + 1}.`
        : n === expected
          ? `That's all ${expected}. Compare your shape with the ghost.`
          : `${guide.char} only has ${expected} stroke${expected > 1 ? "s" : ""}. Undo or clear and try again.`;

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Tracing pad for ${guide.char}. Draw with a mouse, finger or pen.`}
        className="aspect-square w-full max-w-[420px] cursor-crosshair touch-none rounded-card border-2 border-hairline bg-card"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drawing.current = [toPoint(e)];
          draw();
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          drawing.current.push(toPoint(e));
          draw();
        }}
        onPointerUp={() => {
          const s = drawing.current;
          drawing.current = null;
          if (s) setStrokes((prev) => [...prev, s]);
        }}
        onPointerCancel={() => {
          drawing.current = null;
          draw();
        }}
      />
      <div className="mt-4 flex w-full max-w-[420px] flex-wrap items-center justify-between gap-3">
        <p className="font-display text-[22px] font-black text-ink tabular-nums" aria-live="polite">
          <span className="sr-only">Strokes drawn: </span>
          <span className={n > expected ? "text-wrong" : n === expected ? "text-correct" : ""}>{n}</span>
          <span className="text-muted"> / {expected}</span>
        </p>
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost" onClick={() => setStrokes((s) => s.slice(0, -1))} disabled={n === 0}>
            Undo
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setStrokes([])} disabled={n === 0}>
            Clear
          </button>
        </div>
      </div>
      <p className="mt-2 w-full max-w-[420px] text-[15px] text-muted" aria-live="polite">{status}</p>
    </div>
  );
}
