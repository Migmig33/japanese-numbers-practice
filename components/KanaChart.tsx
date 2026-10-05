import {
  BASIC, BASIC_ROWS, COMBO, COMBO_ROWS, COMBO_VOWELS, DAKUTEN, DAKUTEN_ROWS, rowOf, VOWELS, type Kana,
} from "@/lib/hiragana";

/** One character with its sound underneath. */
function Cell({ item }: { item: Kana | null }) {
  if (!item) return <td className="p-1" aria-hidden="true" />;
  return (
    <td className="p-1">
      <div className="flex flex-col items-center rounded-button border border-hairline bg-paper py-2">
        <span lang="ja" className="jp text-[clamp(22px,5vw,32px)] leading-none text-ink">{item.kana}</span>
        <span className="mt-1 text-[13px] font-bold text-muted">{item.romaji}</span>
      </div>
    </td>
  );
}

function Grid({
  caption, rows, source, vowels, columns,
}: {
  caption: string;
  rows: readonly string[];
  source: readonly Kana[];
  /** Which vowel columns this grid has — combinations only use a, u and o. */
  vowels: readonly string[];
  columns: readonly string[];
}) {
  return (
    <div className="my-6 overflow-x-auto rounded-card border border-hairline bg-card p-2">
      <table className="w-full border-collapse">
        <caption className="px-3 pt-3 pb-2 text-left font-display text-[20px] font-black text-primary">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="w-10 px-2 py-1 text-[13px] font-bold text-muted">—</th>
            {columns.map((v) => (
              <th key={v} scope="col" className="px-2 py-1 text-[13px] font-bold text-muted">{v}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r}>
              <th scope="row" className="px-2 text-[13px] font-bold text-muted">{r === "a" ? "—" : r}</th>
              {rowOf(source, r, vowels).map((item, i) => (
                <Cell key={`${r}-${i}`} item={item} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The full syllabary, laid out the way it is normally printed. */
export function KanaChart() {
  return (
    <>
      <Grid caption="The 46 basic characters" rows={BASIC_ROWS} source={BASIC} vowels={VOWELS} columns={VOWELS} />
      {/* ん has no vowel, so it belongs to no row of the grid. */}
      <div className="my-6 flex flex-wrap items-center gap-4 rounded-card border border-hairline bg-card p-4">
        <div className="flex w-20 flex-col items-center rounded-button border border-hairline bg-paper py-2">
          <span lang="ja" className="jp text-[32px] leading-none text-ink">ん</span>
          <span className="mt-1 text-[13px] font-bold text-muted">n</span>
        </div>
        <p className="min-w-0 flex-1 text-[15px] leading-normal text-ink/90">
          <strong className="text-ink">ん stands alone.</strong> It is the only character that is a consonant by
          itself, with no vowel attached, which is why it sits outside the grid — and why Japanese words can end in
          an n sound but no other consonant.
        </p>
      </div>
      <Grid
        caption="With a dakuten ゛or handakuten ゜"
        rows={DAKUTEN_ROWS}
        source={DAKUTEN}
        vowels={VOWELS}
        columns={VOWELS}
      />
      <Grid
        caption="Combinations with small ゃ, ゅ, ょ"
        rows={COMBO_ROWS}
        source={COMBO}
        vowels={COMBO_VOWELS}
        columns={["ya", "yu", "yo"]}
      />
    </>
  );
}
