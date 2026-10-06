"use client";

import { useEffect, useRef, useState } from "react";
import { autoPlayReady, shouldWaitForVoice, VOICE_GRACE_MS } from "@/lib/speech";
import { useSpeech } from "./SpeechProvider";

/**
 * Plays a piece of Japanese aloud, using the device's best Japanese voice when it has
 * one and whatever the browser offers for ja-JP when it does not. It disappears only on
 * a device with no speech synthesiser at all, where the button could do nothing
 * whatever; `SpeechNotice` explains that, and warns about a missing Japanese voice.
 */
export function SpeakButton({
  text,
  id,
  label,
  size = 40,
  autoPlay = false,
}: {
  /** The Japanese to speak — not the romaji; the voice wants the real script. */
  text: string;
  /** Unique per button, so only the one that is talking shows as playing. */
  id: string;
  /** Read out by screen readers, e.g. "Play は". */
  label: string;
  size?: number;
  /**
   * Speak once, unprompted, as soon as the button appears. Only for audio the user has
   * just asked for by acting — a revealed answer — and the caller must remount the
   * button (a changing `key`) for each new one, since this fires on mount.
   */
  autoPlay?: boolean;
}) {
  const { speak, speakingId, canSpeak, status } = useSpeech();
  const played = useRef(false);
  const [waited, setWaited] = useState(false);

  /*
   * The grace period runs for any status that is not yet settled, not just "unknown".
   * `status` is a dependency, so gating it on "unknown" alone meant the timer was torn
   * down the moment voices loaded with no Japanese one among them — and never re-armed —
   * leaving `waited` false forever and the answer silent on exactly the devices that
   * `autoPlayReady` means to let through after the wait.
   */
  useEffect(() => {
    if (!autoPlay || waited || !shouldWaitForVoice(status)) return;
    const t = window.setTimeout(() => setWaited(true), VOICE_GRACE_MS);
    return () => window.clearTimeout(t);
  }, [autoPlay, waited, status]);

  useEffect(() => {
    if (!autoPlay || played.current || !autoPlayReady(status, waited)) return;
    played.current = true;
    speak(text, id);
  }, [autoPlay, status, waited, speak, text, id]);

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
 * Explains the audio when it is not going to be right: either there is no synthesiser
 * at all, or there is one with no Japanese voice, which reads the sentence in the wrong
 * accent. Renders nothing when a Japanese voice was found, so the common case stays
 * uncluttered.
 */
export function SpeechNotice({ className = "" }: { className?: string }) {
  const { status } = useSpeech();
  if (status === "unknown" || status === "ready") return null;
  const box = `rounded-card border border-hairline bg-paper px-4 py-3 text-[15px] text-muted ${className}`;

  if (status === "unsupported") {
    return (
      <p className={box}>
        This browser will not read Japanese aloud, so the listen buttons are hidden. Chrome, Edge and Safari all
        speak it — the written readings below are unaffected either way.
      </p>
    );
  }
  return (
    <p className={box}>
      Your device has no Japanese voice installed, so the sentences are read in whatever voice your browser
      substitutes and the pronunciation may be off. Adding Japanese under your system&apos;s language or
      text-to-speech settings fixes it. The written readings are unaffected.
    </p>
  );
}
