const MACRONS: Record<string, string> = { ū: "u", ō: "o", ā: "a", ē: "e", ī: "i", û: "u", ô: "o", â: "a", ê: "e", î: "i" };

/**
 * Reduce a romaji answer to a canonical form so that "KYŪ", "kyuu", "kyu" and "Kyū "
 * all compare equal. Applied to both the user's input and every stored reading.
 */
export function normalize(input: string): string {
  return input
    .normalize("NFKC") // full-width IME letters → ASCII
    .toLowerCase()
    .replace(/[ūōāēīûôâêî]/g, (c) => MACRONS[c] ?? c)
    .replace(/['’‘`\-‐–—]/g, "")
    .replace(/\s+/g, "") // readings are single words, so "san juu" should equal "sanjuu"
    .replace(/([aeiou])\1+/g, "$1");
}

export function matchesReading(input: string, readings: readonly string[]): boolean {
  const n = normalize(input);
  if (n === "") return false;
  return readings.some((r) => normalize(r) === n);
}
