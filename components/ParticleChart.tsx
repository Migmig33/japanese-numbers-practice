"use client";

import { PARTICLES, spokenForm } from "@/lib/particles";
import { SpeakButton, SpeechNotice } from "./SpeakButton";

/**
 * The particle reference table, with each particle's reading set under the character and
 * a listen button on both the particle and its example sentence.
 *
 * A client component so the buttons can reach the speech synthesiser, but it still
 * prerenders into the exported HTML, so the table remains crawlable as a real <table>.
 */
export function ParticleChart() {
  return (
    <>
      <SpeechNotice className="my-6" />
      <div className="my-6 overflow-x-auto rounded-card border border-hairline bg-card">
        <table className="w-full border-collapse text-left">
          <caption className="px-5 pt-4 pb-2 text-left font-display text-[20px] font-black text-primary">
            What each particle does
          </caption>
          <thead>
            <tr className="border-b border-hairline text-[14px] text-muted">
              <th scope="col" className="px-5 py-2 font-bold">Particle</th>
              <th scope="col" className="px-5 py-2 font-bold">Listen</th>
              <th scope="col" className="px-5 py-2 font-bold">Job</th>
              <th scope="col" className="px-5 py-2 font-bold">Example</th>
            </tr>
          </thead>
          <tbody>
            {PARTICLES.map((p) => (
              <tr key={p.jp} className="border-b border-hairline last:border-b-0">
                <th scope="row" className="px-5 py-3 text-left font-normal">
                  <span className="flex flex-col items-center">
                    <span lang="ja" className="jp text-jp leading-tight whitespace-nowrap text-ink">{p.jp}</span>
                    <span className="mt-0.5 font-sans text-[15px] font-bold text-primary">{p.romaji}</span>
                  </span>
                </th>
                <td className="px-5 py-3">
                  <SpeakButton
                    id={`particle-${p.jp}`}
                    text={spokenForm(p)}
                    label={`${p.jp}, said ${p.romaji}`}
                  />
                </td>
                <td className="px-5 py-3 text-[15px] leading-normal text-ink/90">{p.job}</td>
                <td className="px-5 py-3">
                  <span className="flex items-center gap-3">
                    <SpeakButton id={`example-${p.jp}`} text={p.example} label={`the example, ${p.exampleEnglish}`} size={34} />
                    <span className="min-w-0">
                      <span lang="ja" className="jp block text-[20px] text-ink">{p.example}</span>
                      <span className="block text-[14px] text-muted">{p.exampleEnglish}</span>
                    </span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
