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
 * Japanese voices known to be male, by name. SpeechSynthesisVoice carries no gender
 * field, so the name is the only thing to go on. These are the ja-JP voices shipped by
 * Windows (Ichiro, Keita, Naoki), the Azure/Edge natural set (Keita, Daichi, Naoki) and
 * macOS (Otoya, Hattori). The female ones — Haruka, Nanami, Ayumi, Kyoko, Aoi, Mayu,
 * Shiori — are simply the ones not named here.
 */
export const MALE_JAPANESE_VOICES = ["ichiro", "keita", "daichi", "naoki", "otoya", "hattori", "masaru"] as const;

/**
 * Whether a voice name denotes a man. Some platforms say so outright, e.g. "Japanese
 * Male", so the name is split into words and matched whole — a substring test would
 * read "female" as male.
 */
export function isMaleVoice(name: string): boolean {
  const n = name.toLowerCase();
  return n.split(/[^a-z]+/).includes("male") || MALE_JAPANESE_VOICES.some((m) => n.includes(m));
}

/**
 * The best Japanese voice among those the device offers, or null if it has none.
 *
 * A male voice wins over any female one: every reading on the site is Sennin speaking,
 * and he is an old hermit — PITCH does the rest of that. Below that, local voices are
 * preferred, since they work offline and start without a network round trip. The
 * cascade runs over the male voices first and the full list second, so a device whose
 * only Japanese voices are female still gets its best one rather than none.
 */
export function pickJapaneseVoice<T extends VoiceLike>(voices: readonly T[]): T | null {
  const ja = voices.filter((v) => /^ja(\b|[-_])/i.test(v.lang));
  if (ja.length === 0) return null;
  const best = (pool: readonly T[]) =>
    pool.find((v) => v.localService && v.default) ??
    pool.find((v) => v.localService) ??
    pool.find((v) => v.default) ??
    pool[0];
  return best(ja.filter((v) => isMaleVoice(v.name))) ?? best(ja)!;
}

/**
 * - "unknown" — voices have not been listed yet. getVoices() is commonly empty on the
 *   first call and fills in on a later `voiceschanged` event, and some platforms
 *   (Android Chrome especially) never populate it at all.
 * - "ready" — the device has a Japanese voice and it has been picked.
 * - "no-voice" — the device listed its voices and none are Japanese. We still speak,
 *   tagged ja-JP, and let the browser do what it can: an imperfect reading the user
 *   asked for beats a control that silently refuses to exist. `SpeechNotice` says the
 *   pronunciation may be off and how to fix it.
 * - "unsupported" — there is no speech synthesiser, or it refused the utterance
 *   outright. This is the only state with no audio at all.
 */
export type SpeechStatus = "unknown" | "ready" | "no-voice" | "unsupported";

/**
 * Error codes that mean this device will not speak Japanese, as opposed to the routine
 * "canceled"/"interrupted" we cause ourselves every time one utterance replaces another.
 */
export function isFatalSpeechError(code: string): boolean {
  return (
    code === "synthesis-unavailable" ||
    code === "synthesis-failed" ||
    code === "language-unavailable" ||
    code === "voice-unavailable" ||
    code === "not-allowed"
  );
}

/** A slight slowdown: this is for copying a sound, not for listening at native speed. */
const RATE = 0.85;

/**
 * Sennin is old, so he speaks below the voice's natural pitch. Kept at 0.8 rather than
 * lower: the audio exists to be copied by a learner, and under about 0.6 the
 * synthesiser's vowels start to smear and the pitch accent goes with them.
 */
const PITCH = 0.8;

/**
 * How long an auto-play waits for `getVoices()` to fill in before speaking anyway.
 * Android Chrome never populates the list yet still honours an utterance tagged ja-JP,
 * so waiting indefinitely would mean silence there; waiting a moment first means the
 * desktop browsers that do populate it late still get the Japanese voice rather than
 * whatever default happened to be loaded when the answer appeared.
 */
export const VOICE_GRACE_MS = 800;

/**
 * Whether the grace period still has something to wait for, i.e. the status could yet
 * improve. Both unsettled states qualify, and "no-voice" is the one worth spelling out:
 * it reads like a final answer but is not, so a caller that waits only on "unknown"
 * stops waiting the instant the voice list arrives without Japanese in it, and the
 * auto-play that `autoPlayReady` would then allow never happens.
 */
export function shouldWaitForVoice(status: SpeechStatus): boolean {
  return status === "unknown" || status === "no-voice";
}

/**
 * Whether an auto-play should go ahead yet. `waited` is the grace period above having
 * elapsed without a Japanese voice turning up.
 *
 * Only "ready" starts at once. "no-voice" has to wait too, even though it looks like a
 * settled answer: Edge's first getVoices() returns just the local Windows voices and
 * delivers its Azure "Online (Natural)" set — where the male Japanese voices live — on a
 * later voiceschanged event. Speaking during that gap gets no voice object at all, so
 * the browser falls back to its own default for ja-JP, which is a woman, and the pick
 * below never gets a say.
 */
export function autoPlayReady(status: SpeechStatus, waited: boolean): boolean {
  if (status === "unsupported") return false;
  return status === "ready" || waited;
}

/**
 * The synthesiser itself. Not called directly by components — `SpeechProvider` holds a
 * single instance for the page and hands it out through context, because every listen
 * button used to own one of these, and the kana chart alone has over a hundred buttons.
 */
export function useSpeechEngine() {
  const [voice, setVoice] = useState<VoiceLike | null>(null);
  const [status, setStatus] = useState<SpeechStatus>("unknown");
  /** Which button is mid-utterance, so only that one shows a playing state. */
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const speakingRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setStatus("unsupported");
      return;
    }
    const synth = window.speechSynthesis;
    const load = () => {
      const voices = synth.getVoices();
      if (voices.length === 0) return; // not loaded yet; the event will fire
      const found = pickJapaneseVoice(voices);
      setVoice(found);
      setStatus(found ? "ready" : "no-voice");
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
      /*
       * The list is re-read here rather than trusted from state. Voices arrive
       * asynchronously, so by the time a button is actually pressed the browser often
       * knows about voices it had not reported when this hook mounted — and an
       * utterance with no voice set falls back to the browser's default for ja-JP,
       * losing the male preference.
       */
      const best = voice ?? pickJapaneseVoice(synth.getVoices());
      if (best) u.voice = best as SpeechSynthesisVoice;
      u.rate = RATE;
      u.pitch = PITCH;
      const done = () => {
        if (speakingRef.current === id) {
          speakingRef.current = null;
          setSpeakingId(null);
        }
      };
      u.onend = done;
      u.onerror = (e) => {
        // Only a refusal counts; we cancel utterances ourselves all the time.
        if (isFatalSpeechError((e as SpeechSynthesisErrorEvent).error ?? "")) setStatus("unsupported");
        done();
      };
      speakingRef.current = id;
      setSpeakingId(id);
      synth.speak(u);
    },
    [voice, stop],
  );

  // Leaving the page mid-sentence should not keep talking.
  useEffect(() => stop, [stop]);

  return {
    speak,
    stop,
    speakingId,
    status,
    /** Whether to offer the control at all. Only a device with no synthesiser loses it. */
    canSpeak: status !== "unsupported",
    /** True once we know the reading will be in a real Japanese voice. */
    hasJapaneseVoice: status === "ready",
  };
}
