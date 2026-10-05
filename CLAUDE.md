Build **Sennin**, an ad-supported website for learning Japanese numbers and telling time.
Think of a free quiz page someone lands on from searching "japanese numbers quiz" — SEO
content pages with an interactive quiz widget embedded in them, no accounts, no backend.

## Stack
Next.js 15 (App Router) + TypeScript (strict) + Tailwind CSS v4. Static export
(`output: 'export'` in next.config.ts) — every page prerenders, the quiz runs client-side.
No database, no auth, no API routes. Vitest for unit tests.

## Build order — follow this, don't jump to UI
1. Scaffold the app and get `npm run dev` serving a blank styled page. Commit.
2. Build `lib/` — types, the item dataset, answer normalization, scoring, persistence —
   with unit tests passing. Commit. **Do this before any component.**
3. Build the page shell (header, breadcrumb, footer, ad slots) and one static page. Commit.
4. Build the quiz widget and its four states on /japanese-numbers-quiz. Commit.
5. Build the remaining three pages. Commit.
6. Run `npm run build` and fix anything that fails to prerender.

## Data layer — `lib/`

```ts
export type SetId =
  | "ones" | "teens-tens" | "hundreds" | "thousands" | "tenthousands" | "native"
  | "hours" | "minutes" | "half" | "ampm" | "question";

export type Item = {
  id: string;
  jp: string;            // 六百
  readings: string[];    // every accepted reading, normalized form
  set: SetId;
  kind: "number" | "hour" | "minute" | "modifier";
  value?: number;
  note?: string;         // rule shown when the user misses it
};
```

**Generate the number items from rules, don't hardcode a hundred rows.**
- 1–10: 一 ichi, 二 ni, 三 san, 四 yon (also shi), 五 go, 六 roku, 七 nana (also shichi),
  八 hachi, 九 kyuu (also ku), 十 juu.
- 11–99: compose tens + ones. 20 = nijuu, 34 = sanjuuyon, 99 = kyuujuukyuu.
- Hundreds: n + hyaku, with overrides 300 sanbyaku, 600 roppyaku, 800 happyaku.
- Thousands: n + sen, with overrides 3000 sanzen, 8000 hassen.
- 10000 = ichiman, never bare "man".
- Native series: ひとつ hitotsu, ふたつ futatsu, みっつ mittsu, よっつ yottsu, いつつ itsutsu,
  むっつ muttsu, ななつ nanatsu, やっつ yattsu, ここのつ kokonotsu, とお too.

**Time items are irregular — use this table verbatim, do not derive or invent them:**
Hours: 一時 ichiji, 二時 niji, 三時 sanji, 四時 **yoji**, 五時 goji, 六時 rokuji,
七時 **shichiji**, 八時 hachiji, 九時 **kuji**, 十時 juuji, 十一時 juuichiji, 十二時 juuniji.
四時 is never yonji. 九時 is never kyuuji.
Minutes: 一分 ippun, 二分 nifun, 三分 sanpun, 四分 yonpun, 五分 gofun, 六分 roppun,
七分 nanafun, 八分 happun (also hachifun), 九分 kyuufun, 十分 juppun (also jippun).
Modifiers: 半 han, 午前 gozen, 午後 gogo, 何時 nanji, 何分 nanpun.

Attach `note` to every sound-change item, e.g. 六百 → "六 + 百 → roppyaku. The h-sound
becomes p after 六, 八 and 十."

### `lib/normalize.ts` — this is the part that decides whether the app feels fair
Normalize both the user's input and the stored readings before comparing:
lowercase, trim, collapse internal whitespace; map macrons ū→u ō→o ā→a ē→e ī→i;
collapse doubled vowels (juu→ju, kyuu→kyu, too→to); strip apostrophes and hyphens.
So "KYŪ", "kyuu", "kyu" and "Kyū " all match. Write tests for every one of those cases
plus the alternate readings (shichi/nana, yon/shi, kyuu/ku, juppun/jippun).

### `lib/scoring.ts` — pure functions, unit tested
- 10 base points per correct answer, plus `Math.round(10 * max(0, (3000 - ms) / 3000))`
  speed bonus, times the streak multiplier.
- Multiplier: ×1, rising to ×2 at 3 consecutive correct and ×3 at 6. Any miss resets to ×1.
- Export `scoreAnswer({ correct, ms, streak })` and `nextMultiplier(streak)`.

### `lib/progress.ts`
localStorage under a versioned key `sennin.v1`. Wrap every read and write in try/catch —
it throws in private browsing. Shape: per-item attempt counts and correct counts, XP,
level, best score, rounds played, and an ISO date list for the streak calendar.
Export a `useProgress()` hook. Never crash when storage is unavailable; fall back to
in-memory state for the session.

### `lib/srs.ts`
A missed item is re-queued to reappear two questions later. Items whose accuracy is under
50% after 4 or more attempts are "leeches" — expose `getLeeches(progress, items)`.

## The mascot
Move `sennin-sprite-sheet.webp` to `public/`. It is 1920×1400, 8 columns × 5 rows, frames
240×280, transparent. Build `components/Sennin.tsx`:

```
props: state: "idle" | "correct" | "wrong" | "streak" | "levelup", size?: number,
       onRest?: (state) => void
rows:  idle 0 @10fps loop | correct 1 @14fps once | wrong 2 @14fps once
       streak 3 @10fps loop | levelup 4 @12fps once
```
Animate with a CSS `steps(8)` keyframe on `background-position-x` from 0 to -1920px, and
pick the row with `background-position-y: -280px * row`. Scale with a transform on an
inner div, not by resizing the background. One-shot cycles return to idle and then call
`onRest`. Restart cleanly when the same state is set twice (remount via a key). Preload
the image. Honor `prefers-reduced-motion` by holding frame 0.
He is a bust — no arms, so never write UI that assumes he points, waves or holds anything.

## Routes
```
/                                     home, explains the site, links to the three quizzes
/japanese-numbers-quiz                numbers quiz
/telling-time-in-japanese             clock quiz
/japanese-number-kanji-writing        stroke tracing
/progress                             stats and mastery heatmap
```

Every content page has the same shape: sticky header → breadcrumb → 728×90 ad → H1 →
intro paragraph → the widget → reference table → 336×280 ad → FAQ accordion (6 questions,
first one open) → three related-post cards → footer. Content column 760px centered; the
widget may break out to 940px. At ≥1280px a 300×600 sticky ad sits in a right rail.

## Components
`SiteHeader` (72px, wordmark + 32px mascot head, nav: Numbers / Time / Writing / Progress),
`Breadcrumb`, `SiteFooter` (four link columns), `AdSlot`, `Faq` (accordion, also emits
FAQPage JSON-LD), `SetPicker`, `QuizWidget`, `QuestionCard`, `ResultBar`, `SummaryCard`,
`ClockSet`, `TraceCanvas`, `MasteryHeatmap`, `Sennin`.

`AdSlot` takes a size and renders a labeled dashed placeholder in development and an empty
slot div in production. Keep the ad network swappable — load any script with `next/script`
and `strategy="afterInteractive"`. Never render an ad inside an active question.

**QuizWidget states:**
- *picking* — toggle chips in two groups, "数字 Numbers" and "時間 Time", an "Uncheck all"
  link, and a primary button reading "Start (62)" with the live selected count.
- *question* — 12-cell segmented progress bar, elapsed timer, gold streak badge "×2",
  the character at 88px on a card, "Type the reading", a text input, a "Check" button
  disabled while empty, and a "Skip" link. Sennin idles at the left at 120px.
- *correct* — green bar rises from the bottom: "正解!", the reading, "+28 (×2 streak)",
  a "Continue" button. Sennin plays correct.
- *wrong* — red bar: "おしい!", the correct reading, the item's `note` in a bordered box.
  Multiplier resets with a shake. Sennin plays wrong.
- *summary* — Sennin plays levelup at 200px, "レベルアップ!", a four-up stat grid (Score,
  Accuracy, Longest streak, XP earned), the 336×280 ad, a "Review these" list of missed
  items, then "Play again" and "Back to sets".

`ClockSet`: a 320px analog clock, draggable hour and minute hands, 12 ticks, Japanese
numerals 一 to 十二 around the dial, snapping minutes to 5. Must work with mouse, touch
and keyboard (arrow keys adjust the focused hand).

`TraceCanvas`: a 420px square canvas showing the target character as a pale ghost with
numbered stroke-start dots. Capture pointer strokes, show a stroke counter, undo and clear.
Stroke-order correctness checking is out of scope for now — count strokes and let the user
self-check against the ghost.

## Design system — put these in Tailwind theme tokens, not literals
ink #1B2130, paper #F6F4EF, card #FFFFFF, primary #3E4D6C, primary-dark #2C3850,
accent #E8B84B, correct #2E9E6B, wrong #D4584C, muted #7C879C, hairline #E2DED5.
Fonts via `next/font/google`: "Zen Maru Gothic" (700, 900) for headings, numerals and
Japanese characters; "Zen Kaku Gothic New" (400, 500, 700) for body and UI.
Body 17px/1.7, H1 44px, card radius 16px, button radius 14px.
Buttons are solid with a 4px darker bottom edge that compresses to 1px on press.
Japanese renders large — 88px for the character under test, 40px minimum elsewhere.
Tabular numerals on every score, timer and percentage.
No gradients, no glassmorphism, no shadows on text.

## SEO — this is how the site gets traffic, treat it as a feature
- `generateMetadata` per route with a distinct title and description, plus canonical URLs.
- JSON-LD on every quiz page: `FAQPage` built from that page's FAQ items, and `Quiz`.
- `app/sitemap.ts` and `app/robots.ts`.
- Semantic headings — one H1, real H2s. Reference tables are real `<table>` elements.
- The FAQ content must be in the HTML at build time, not fetched or revealed by JS.

## Accessibility
Keyboard-operable everywhere, visible focus rings, labelled form controls, ARIA live
region announcing correct/incorrect, and `prefers-reduced-motion` respected by the mascot
and every transition.

## Do not
No login, signup, profile or settings. No global leaderboard — there are no accounts.
No counters (人, 個, 本), dates (月, 日) or days of the week; those are a later phase.
No emoji as section icons. Don't let the quiz take over the viewport and hide the page
around it. **Don't invent or derive Japanese readings — use the tables above verbatim.**