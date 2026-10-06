"use client";

import { createContext, useContext } from "react";
import { useSpeechEngine } from "@/lib/speech";

type Speech = ReturnType<typeof useSpeechEngine>;

/**
 * What consumers get when there is no provider above them. Silent rather than throwing:
 * a missing provider should cost the page its audio, not blank the whole quiz.
 */
const SILENT: Speech = {
  speak: () => {},
  stop: () => {},
  speakingId: null,
  status: "unsupported",
  canSpeak: false,
  hasJapaneseVoice: false,
};

const SpeechContext = createContext<Speech>(SILENT);

/**
 * One synthesiser for the whole page, so that every listen button shares one voice
 * lookup, one `voiceschanged` subscription and one notion of what is currently talking
 * — pressing a second button stops the first, everywhere on the page.
 */
export function SpeechProvider({ children }: { children: React.ReactNode }) {
  const speech = useSpeechEngine();
  return <SpeechContext.Provider value={speech}>{children}</SpeechContext.Provider>;
}

export function useSpeech() {
  return useContext(SpeechContext);
}
