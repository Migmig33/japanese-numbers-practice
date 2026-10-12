import { describe, expect, it } from "vitest";
import {
  autoPlayReady, isFatalSpeechError, isFemaleVoice, isGoogleVoice, pickJapaneseVoice, shouldWaitForVoice, type VoiceLike,
} from "./speech";

const v = (lang: string, name: string, extra: Partial<VoiceLike> = {}): VoiceLike => ({ lang, name, ...extra });

describe("pickJapaneseVoice", () => {
  it("returns null when the device has no Japanese voice", () => {
    expect(pickJapaneseVoice([v("en-US", "Alex"), v("fr-FR", "Thomas")])).toBeNull();
  });

  it("returns null for an empty list rather than guessing", () => {
    expect(pickJapaneseVoice([])).toBeNull();
  });

  it("finds a Japanese voice among others", () => {
    const ja = v("ja-JP", "Kyoko");
    expect(pickJapaneseVoice([v("en-US", "Alex"), ja, v("de-DE", "Anna")])).toBe(ja);
  });

  it("accepts the bare 'ja' tag and underscore form", () => {
    expect(pickJapaneseVoice([v("ja", "Voice")])?.name).toBe("Voice");
    expect(pickJapaneseVoice([v("ja_JP", "Voice")])?.name).toBe("Voice");
  });

  it("is case insensitive about the language tag", () => {
    expect(pickJapaneseVoice([v("JA-JP", "Voice")])?.name).toBe("Voice");
  });

  it("does not mistake another language that merely starts with ja", () => {
    expect(pickJapaneseVoice([v("jav", "Javanese"), v("ja-x", "Weird")])?.name).toBe("Weird");
  });

  it("prefers a woman", () => {
    const kyoko = v("ja-JP", "Kyoko");
    expect(pickJapaneseVoice([v("ja-JP", "Otoya"), kyoko])).toBe(kyoko);
    expect(pickJapaneseVoice([v("ja-JP", "Microsoft Keita"), v("ja-JP", "Microsoft Nanami Online (Natural)")])?.name)
      .toBe("Microsoft Nanami Online (Natural)");
  });

  it("takes a female voice over a better-placed non-female one", () => {
    const other = v("ja-JP", "Microsoft Keita", { localService: true, default: true });
    const haruka = v("ja-JP", "Microsoft Haruka");
    expect(pickJapaneseVoice([other, haruka])).toBe(haruka);
  });

  it("still picks the best non-Google voice when no named woman is on offer", () => {
    const local = v("ja-JP", "Device Japanese", { localService: true });
    expect(pickJapaneseVoice([v("ja-JP", "Other Japanese"), local])).toBe(local);
  });

  it("does not select Google voices", () => {
    expect(pickJapaneseVoice([v("ja-JP", "Google Japanese"), v("ja-JP", "Kyoko")])?.name).toBe("Kyoko");
    expect(pickJapaneseVoice([v("ja-JP", "Google Japanese")])).toBeNull();
  });

  it("prefers a local voice over a remote one", () => {
    const local = v("ja-JP", "Local", { localService: true });
    expect(pickJapaneseVoice([v("ja-JP", "Remote", { localService: false }), local])).toBe(local);
  });

  it("prefers the local default over another local voice", () => {
    const pick = v("ja-JP", "LocalDefault", { localService: true, default: true });
    expect(pickJapaneseVoice([v("ja-JP", "LocalOther", { localService: true }), pick])).toBe(pick);
  });

  it("falls back to a remote default, then to the first", () => {
    const def = v("ja-JP", "RemoteDefault", { default: true });
    expect(pickJapaneseVoice([v("ja-JP", "Other"), def])).toBe(def);
    expect(pickJapaneseVoice([v("ja-JP", "First"), v("ja-JP", "Second")])?.name).toBe("First");
  });
});

describe("autoPlayReady", () => {
  it("plays as soon as a Japanese voice is known", () => {
    expect(autoPlayReady("ready", false)).toBe(true);
  });

  it("holds a device with no Japanese voice too, in case a better list is still coming", () => {
    expect(autoPlayReady("no-voice", false)).toBe(false);
  });

  it("plays with a substitute voice once that wait is up", () => {
    expect(autoPlayReady("no-voice", true)).toBe(true);
  });

  it("never plays where there is no synthesiser, however long it waits", () => {
    expect(autoPlayReady("unsupported", false)).toBe(false);
    expect(autoPlayReady("unsupported", true)).toBe(false);
  });

  it("holds while the voice list is still unknown", () => {
    expect(autoPlayReady("unknown", false)).toBe(false);
  });

  it("plays anyway once the wait is up, for platforms that never list voices", () => {
    expect(autoPlayReady("unknown", true)).toBe(true);
  });
});

describe("shouldWaitForVoice", () => {
  it("waits while the voice list is still unknown", () => {
    expect(shouldWaitForVoice("unknown")).toBe(true);
  });

  it("keeps waiting after a list with no Japanese voice, since a better one may follow", () => {
    expect(shouldWaitForVoice("no-voice")).toBe(true);
  });

  it("stops waiting once a Japanese voice is in hand", () => {
    expect(shouldWaitForVoice("ready")).toBe(false);
  });

  it("stops waiting where there is no synthesiser to wait for", () => {
    expect(shouldWaitForVoice("unsupported")).toBe(false);
  });

  it("agrees with autoPlayReady: every state it waits on plays once the wait is up", () => {
    for (const s of ["unknown", "no-voice"] as const) {
      expect(autoPlayReady(s, false)).toBe(false);
      expect(autoPlayReady(s, true)).toBe(true);
    }
  });
});

describe("isFatalSpeechError", () => {
  it("ignores the cancellations we cause ourselves", () => {
    expect(isFatalSpeechError("canceled")).toBe(false);
    expect(isFatalSpeechError("interrupted")).toBe(false);
  });

  it("ignores a transient busy audio device", () => {
    expect(isFatalSpeechError("audio-busy")).toBe(false);
  });

  it("treats a refusal to speak as fatal", () => {
    for (const code of ["synthesis-unavailable", "synthesis-failed", "language-unavailable", "voice-unavailable", "not-allowed"]) {
      expect(isFatalSpeechError(code)).toBe(true);
    }
  });

  it("does not treat an unrecognised code as fatal", () => {
    expect(isFatalSpeechError("")).toBe(false);
  });
});

describe("isFemaleVoice", () => {
  it("knows the named Japanese women", () => {
    for (const n of ["Microsoft Haruka Desktop", "Nanami", "Ayumi", "Kyoko", "Aoi", "Mayu", "Shiori"]) {
      expect(isFemaleVoice(n)).toBe(true);
    }
  });

  it("does not claim other voices are women", () => {
    for (const n of ["Microsoft Ichiro", "Keita", "ja-JP-DaichiNeural", "Otoya", "Hattori"]) {
      expect(isFemaleVoice(n)).toBe(false);
    }
  });

  it("reads a platform that states the gender outright", () => {
    expect(isFemaleVoice("Japanese Female")).toBe(true);
  });

  it("does not read 'female' as a name match for other genders", () => {
    expect(isFemaleVoice("Japanese Male")).toBe(false);
    expect(isFemaleVoice("ja-JP-MaleVoice")).toBe(false);
  });
});

describe("isGoogleVoice", () => {
  it("recognises Google voice names case-insensitively", () => {
    expect(isGoogleVoice("Google Japanese")).toBe(true);
    expect(isGoogleVoice("google 日本語")).toBe(true);
    expect(isGoogleVoice("Microsoft Haruka")).toBe(false);
  });
});
