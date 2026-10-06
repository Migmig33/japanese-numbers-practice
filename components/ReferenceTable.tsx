import type { Item } from "@/lib/types";
import { SpeakButton } from "./SpeakButton";

type Props = {
  caption: string;
  items: Item[];
  /** Header for the first column, e.g. "Number" or "Time". */
  valueHeader?: string;
  value?: (item: Item) => string;
  showNotes?: boolean;
};

export function ReferenceTable({ caption, items, valueHeader = "Number", value, showNotes = false }: Props) {
  const fmt = value ?? ((i: Item) => (i.value ?? "").toLocaleString("en"));
  return (
    <div className="my-6 overflow-x-auto rounded-card border border-hairline bg-card">
      <table className="w-full border-collapse text-left">
        <caption className="px-5 pt-4 pb-2 text-left font-display text-[20px] font-black text-primary">{caption}</caption>
        <thead>
          <tr className="border-b border-hairline text-[14px] text-muted">
            <th scope="col" className="px-5 py-2 font-bold">{valueHeader}</th>
            <th scope="col" className="px-5 py-2 font-bold">Kanji</th>
            <th scope="col" className="px-5 py-2 font-bold">Kana</th>
            <th scope="col" className="px-5 py-2 font-bold">Reading</th>
            {showNotes && <th scope="col" className="px-5 py-2 font-bold max-sm:hidden">Why</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id} className="border-b border-hairline last:border-b-0">
              <td className="px-5 py-2 font-bold text-ink tabular-nums">{fmt(i)}</td>
              <td lang="ja" className="jp px-5 py-1 text-jp whitespace-nowrap text-ink">{i.jp}</td>
              <td className="px-5 py-2 whitespace-nowrap">
                <span className="flex items-center gap-2">
                  {/*
                    * The first kana reading is the one spoken: where a number has two —
                    * よん and し — the first is the one the site teaches as the default.
                    */}
                  <SpeakButton id={`ref-${i.id}`} text={i.kana[0] ?? i.jp} label={`the reading, ${i.readings[0]}`} size={32} />
                  <span lang="ja" className="jp text-[20px] text-ink">{i.kana.join(" / ")}</span>
                </span>
              </td>
              <td className="px-5 py-2 font-bold text-primary">{i.readings.join(" / ")}</td>
              {showNotes && <td className="px-5 py-2 text-[15px] leading-normal text-muted max-sm:hidden">{i.note ?? ""}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
