"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { preload } from "react-dom";

export const SPRITE_URL = "/sennin-sprite-sheet.webp";
const FRAME_W = 240;
const FRAME_H = 280;
const FRAMES = 8;

const ANIMATIONS = {
  idle: { row: 0, fps: 10, loop: true },
  correct: { row: 1, fps: 14, loop: false },
  wrong: { row: 2, fps: 14, loop: false },
  streak: { row: 3, fps: 10, loop: true },
  levelup: { row: 4, fps: 12, loop: false },
} as const;

export type SenninState = keyof typeof ANIMATIONS;

type Props = {
  state: SenninState;
  /** Rendered width in px; height follows the 240×280 frame. */
  size?: number;
  /** Called after a one-shot animation finishes and he has returned to idle. */
  onRest?: (state: SenninState) => void;
  className?: string;
};

/**
 * The mascot. A bust with no arms — never build UI that has him point or hold things.
 * To replay the same one-shot state, remount him with a new React `key`.
 */
export function Sennin({ state, size = 120, onRest, className = "" }: Props) {
  preload(SPRITE_URL, { as: "image" });

  const [playing, setPlaying] = useState<SenninState>(state);
  const [lastProp, setLastProp] = useState<SenninState>(state);
  if (state !== lastProp) {
    setLastProp(state);
    setPlaying(state);
  }

  const onRestRef = useRef(onRest);
  useEffect(() => {
    onRestRef.current = onRest;
  });

  const anim = ANIMATIONS[playing];
  const durationMs = (FRAMES / anim.fps) * 1000;

  const rest = useCallback(() => {
    const finished = playing;
    setPlaying("idle");
    onRestRef.current?.(finished);
  }, [playing]);

  // With reduced motion the sprite holds frame 0 and never fires animationend,
  // so finish one-shots on a timer instead.
  useEffect(() => {
    if (anim.loop) return;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(rest, durationMs);
    return () => window.clearTimeout(t);
  }, [anim.loop, durationMs, rest]);

  const scale = size / FRAME_W;

  return (
    <div
      className={`relative shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: Math.round(FRAME_H * scale) }}
      aria-hidden="true"
    >
      <div
        key={playing}
        className="sennin-sprite"
        onAnimationEnd={anim.loop ? undefined : rest}
        style={{
          width: FRAME_W,
          height: FRAME_H,
          backgroundImage: `url(${SPRITE_URL})`,
          backgroundRepeat: "no-repeat",
          backgroundPositionY: -FRAME_H * anim.row,
          animation: `sennin-play ${durationMs}ms steps(${FRAMES}) ${anim.loop ? "infinite" : "1"}`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}

/** Static head-and-hat crop of the idle frame, for the header. */
export function SenninHead({ size = 32 }: { size?: number }) {
  const scale = size / FRAME_W;
  return (
    <span
      className="relative block shrink-0 overflow-hidden rounded-full bg-hairline"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span
        className="absolute top-0 left-0 block"
        style={{
          width: FRAME_W,
          height: FRAME_H,
          backgroundImage: `url(${SPRITE_URL})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "0 0",
          transform: `translateY(${size * 0.08}px) scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </span>
  );
}
