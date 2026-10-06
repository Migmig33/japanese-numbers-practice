"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/*
 * Spoken Japanese, from the browser's own speech synthesiser.
 *
 * The site is a static export with no backend, so there are no audio files to serve and
 * no TTS service to call. SpeechSynthesis is what is left, and it is free, offline on
 * most platforms, and needs nothing shipped. The catch is that it only speaks Japanese
 * if the device has a Japanese voice, which varies by OS and browser — so everything
 * here is built to disappear quietly when it cannot do the job properly. Reading a
 * Japanese sentence aloud in an English voice would teach the wrong sounds, which is
 * worse than silence on a site whose whole purpose is pronunciation.
 */

/** The parts of SpeechSynthesisVoice this picks on, so the choice can be unit tested. */
export type VoiceLike = { lang: string; name: string; localService?: boolean; default?: boolean };

/**
 * The best Japanese voice among those the device offers, or null if it has none.
 * Local voices are preferred: they work offline and start without a network round trip.
 */
export function pickJapaneseVoice<T extends VoiceLike>(voices: readonly T[]): T | null {
  const ja = voices.filter((v) => /^ja(\b|[-_])/i.test(v.lang));
  if (ja.length === 0) return null;
  return (
    ja.find((v) => v.localService && v.default) ??
    ja.find((v) => v.localService) ??
    ja.find((v) => v.default) ??
    ja[0]!
  );
}

/**
 * "unknown" covers the gap before voices load — getVoices() is commonly empty on the
 * first call and fills in on a later `voiceschanged` event. Speaking is allowed while
 * unknown, because some platforms (Android Chrome especially) never populate the list
 * but still honour an utterance tagged ja-JP. It is only switched off once the device
 * has told us what it has and nothing in it is Japanese.
 */
export type SpeechStatus = "unknown" | "ready" | "unavailable";

/** A slight slowdown: this is for copying a sound, not for listening at native speed. */
const RATE = 0.85;

export function useSpeech() {
  const [voice, setVoice] = useState<VoiceLike | null>(null);
  const [status, setStatus] = useState<SpeechStatus>("unknown");
  /** Which button is mid-utterance, so only that one shows a playing state. */
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const speakingRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setStatus("unavailable");
      return;
    }
    const synth = window.speechSynthesis;
    const load = () => {
      const voices = synth.getVoices();
      if (voices.length === 0) return; // not loaded yet; the event will fire
      const found = pickJapaneseVoice(voices);
      setVoice(found);
      setStatus(found ? "ready" : "unavailable");
    };
    load();
    synth.addEventListener("voiceschanged", load);
    return () => {
      synth.removeEventListener("voiceschanged", load);
      synth.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    speakingRef.current = null;
    setSpeakingId(null);
  }, []);

  const speak = useCallback(
    (text: string, id: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const synth = window.speechSynthesis;
      // A second tap on the button that is already talking stops it.
      if (speakingRef.current === id) {
        stop();
        return;
      }
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ja-JP";
      if (voice) u.voice = voice as SpeechSynthesisVoice;
      u.rate = RATE;
      const done = () => {
        if (speakingRef.current === id) {
          speakingRef.current = null;
          setSpeakingId(null);
        }
      };
      u.onend = done;
      u.onerror = done;
      speakingRef.current = id;
      setSpeakingId(id);
      synth.speak(u);
    },
    [voice, stop],
  );

  // Leaving the page mid-sentence should not keep talking.
  useEffect(() => stop, [stop]);

  return { speak, stop, speakingId, status, canSpeak: status !== "unavailable" };
}
