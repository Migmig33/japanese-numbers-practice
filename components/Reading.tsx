/**
 * Japanese with its reading set underneath, word by word. Not <ruby>: ruby puts the
 * gloss above by default, `ruby-position: under` is unevenly supported, and the parts
 * here are whole words rather than per-character furigana. A stack of columns gives the
 * same pairing with layout that behaves everywhere.
 *
 * `lang="ja"` stays on the Japanese only, so a screen reader does not try to read the
 * romaji with a Japanese voice.
 */
export function Reading({
  chunks,
  readings,
  highlight,
  size = "text-[28px]",
}: {
  chunks: readonly string[];
  /** One per chunk, in order. Pass null when they are unavailable; the Japanese still shows. */
  readings: readonly string[] | null;
  /** Index of a chunk to mark out — the particle under test, say. */
  highlight?: number;
  size?: string;
}) {
  return (
    <span className="flex flex-wrap items-end justify-center gap-x-1 gap-y-2">
      {chunks.map((chunk, i) => (
        <span key={`${chunk}-${i}`} className="flex flex-col items-center px-1">
          <span
            lang="ja"
            className={`jp leading-tight ${size} ${i === highlight ? "rounded px-1 bg-accent/25 text-ink" : "text-ink"}`}
          >
            {chunk}
          </span>
          {readings ? (
            <span className={`mt-0.5 text-[13px] leading-none ${i === highlight ? "font-bold text-primary" : "text-muted"}`}>
              {readings[i]}
            </span>
          ) : null}
        </span>
      ))}
    </span>
  );
}
