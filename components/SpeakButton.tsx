"use client";

import { useSpeech } from "@/lib/speech";

/**
 * Plays a piece of Japanese aloud. Renders nothing at all when the device has no
 * Japanese voice — a button that mispronounces, or does nothing when pressed, is worse
 * than no button. `SpeechNotice` explains the absence once per page instead of leaving
 * a row of dead controls.
 */
export function SpeakButton({
  text,
  id,
  label,
  size = 40,
}: {
  /** The Japanese to speak — not the romaji; the voice wants the real script. */
  text: string;
  /** Unique per button, so only the one that is talking shows as playing. */
  id: string;
  /** Read out by screen readers, e.g. "Play は". */
  label: string;
  size?: number;
}) {
  const { speak, speakingId, canSpeak } = useSpeech();
  if (!canSpeak) return null;
  const playing = speakingId === id;

  return (
    <button
      type="button"
      onClick={() => speak(text, id)}
      aria-label={playing ? `Stop ${label}` : `Play ${label}`}
      title={playing ? "Stop" : "Listen"}
      style={{ width: size, height: size }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        playing ? "border-primary bg-primary text-card" : "border-hairline bg-card text-primary hover:border-primary"
      }`}
    >
      {playing ? (
        // A square: pressing again stops it.
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-1/2" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-1/2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" stroke="none" />
          <path d="M15.5 8.5a4.5 4.5 0 0 1 0 7" />
          <path d="M18.5 5.5a8.5 8.5 0 0 1 0 13" />
        </svg>
      )}
    </button>
  );
}

/**
 * Shown once where audio would otherwise be, when the device cannot speak Japanese.
 * Renders nothing when it can, so the common case stays uncluttered.
 */
export function SpeechNotice({ className = "" }: { className?: string }) {
  const { canSpeak } = useSpeech();
  if (canSpeak) return null;
  return (
    <p className={`rounded-card border border-hairline bg-paper px-4 py-3 text-[15px] text-muted ${className}`}>
      Your device has no Japanese voice installed, so the listen buttons are hidden. Adding Japanese to your
      system&apos;s language or text-to-speech settings turns them on — the readings below are unaffected.
    </p>
  );
}
