/*
 * Falling sakura. Decorative only: it sits behind the page, ignores the pointer, and is
 * hidden from assistive tech. The petals are a fixed list rather than random so the
 * prerendered HTML matches hydration, and each starts part-way through its fall (a
 * negative delay) so the screen is already alive on first paint.
 */

type Petal = {
  /** Horizontal start, in %. */
  left: number;
  /** Width in px; height follows. */
  size: number;
  /** Seconds for one fall. */
  fall: number;
  /** Seconds for one sway-and-turn. */
  drift: number;
  /** Negative seconds, so it begins mid-flight. */
  delay: number;
  opacity: number;
};

const PETALS: Petal[] = [
  { left: 4, size: 13, fall: 17, drift: 5.5, delay: -2, opacity: 0.5 },
  { left: 11, size: 9, fall: 23, drift: 7, delay: -11, opacity: 0.35 },
  { left: 18, size: 16, fall: 14, drift: 4.5, delay: -6, opacity: 0.55 },
  { left: 25, size: 11, fall: 20, drift: 6, delay: -15, opacity: 0.4 },
  { left: 32, size: 14, fall: 16, drift: 5, delay: -1, opacity: 0.5 },
  { left: 39, size: 8, fall: 25, drift: 8, delay: -9, opacity: 0.3 },
  { left: 46, size: 15, fall: 18, drift: 5.5, delay: -13, opacity: 0.45 },
  { left: 53, size: 10, fall: 21, drift: 6.5, delay: -4, opacity: 0.35 },
  { left: 60, size: 17, fall: 15, drift: 4.8, delay: -17, opacity: 0.5 },
  { left: 67, size: 12, fall: 19, drift: 6.2, delay: -7, opacity: 0.4 },
  { left: 74, size: 9, fall: 24, drift: 7.5, delay: -20, opacity: 0.3 },
  { left: 81, size: 15, fall: 16, drift: 5.2, delay: -3, opacity: 0.5 },
  { left: 88, size: 11, fall: 22, drift: 6.8, delay: -12, opacity: 0.38 },
  { left: 95, size: 13, fall: 18, drift: 5, delay: -8, opacity: 0.45 },
  { left: 8, size: 10, fall: 26, drift: 7.2, delay: -19, opacity: 0.3 },
  { left: 57, size: 12, fall: 27, drift: 8.5, delay: -23, opacity: 0.32 },
];

export function SakuraFall() {
  return (
    <div className="sakura" aria-hidden="true">
      {PETALS.map((p, i) => (
        <span
          key={i}
          className="petal"
          style={{
            left: `${p.left}%`,
            animationDuration: `${p.fall}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          <span
            className="petal-inner"
            style={{
              width: p.size,
              height: Math.round(p.size * 0.82),
              opacity: p.opacity,
              animationDuration: `${p.drift}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        </span>
      ))}
    </div>
  );
}
