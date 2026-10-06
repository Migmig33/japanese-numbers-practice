import { describe, expect, it } from "vitest";
import { pickJapaneseVoice, type VoiceLike } from "./speech";

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
