import type { Difficulty } from "./modes";
import { ROUND_LENGTH } from "./srs";

/*
 * Particles: the little words that say what each part of a sentence is doing.
 *
 * Every sentence here is short, beginner-level, and chosen so that exactly one particle
 * fits. The wrong options are written out by hand for each sentence rather than picked
 * at random, because a generated distractor can easily be a second correct answer —
 * 学校に行きます and 学校へ行きます are both right, so へ is never offered against に.
 *
 * Many examples use the numbers, times and counters taught elsewhere on the site.
 */

export const PARTICLE_MODE_IDS = ["particle-pick", "particle-order"] as const;
export type ParticleModeId = (typeof PARTICLE_MODE_IDS)[number];

export type ParticleMode = {
  id: ParticleModeId;
  difficulty: Difficulty;
  name: string;
  task: string;
  blurb: string;
  sample: string;
};

export const PARTICLE_MODES: Record<ParticleModeId, ParticleMode> = {
  "particle-pick": {
    id: "particle-pick",
    difficulty: "Easy",
    name: "Fill the gap",
    task: "Pick the particle that fits",
    blurb: "One sentence, one gap, four particles. The quickest way to feel what each one does.",
    sample: "三時 __ 会いましょう → に",
  },
  "particle-order": {
    id: "particle-order",
    difficulty: "Medium",
    name: "Put it in order",
    task: "Tap the words in order",
    blurb: "You get the English and the pieces. Particles only make sense once the order does.",
    sample: "I eat bread → パン を 食べます",
  },
};

/** The particles this page teaches, for the reference table. */
export type ParticleInfo = {
  jp: string;
  /** How it is said — は is written ha but said wa. */
  romaji: string;
  /**
   * What to hand the speech synthesiser, where the particle is said differently from how
   * it is written. A voice given a bare は says "ha", the word, rather than "wa", the
   * particle, so these carry the kana for the sound the romaji column already states.
   * Whole sentences need no such help: a Japanese voice reads particle は as wa from
   * context, which is why only the single characters carry this.
   */
  speak?: string;
  job: string;
  example: string;
  exampleEnglish: string;
};

export const PARTICLES: readonly ParticleInfo[] = [
  { jp: "は", romaji: "wa", speak: "わ", job: "Marks the topic — what the sentence is about.", example: "わたしは学生です。", exampleEnglish: "I am a student." },
  { jp: "が", romaji: "ga", job: "Marks the subject, and goes with あります, います and すき.", example: "犬がいます。", exampleEnglish: "There is a dog." },
  { jp: "を", romaji: "o", speak: "お", job: "Marks the object — the thing the verb acts on.", example: "パンを食べます。", exampleEnglish: "I eat bread." },
  { jp: "に", romaji: "ni", job: "A point in time, a destination, or where something exists.", example: "三時に会いましょう。", exampleEnglish: "Let's meet at three." },
  { jp: "で", romaji: "de", job: "Where an action happens, or what you do it with.", example: "うちで食べます。", exampleEnglish: "I eat at home." },
  { jp: "の", romaji: "no", job: "Joins two nouns: whose, or which kind.", example: "わたしの本です。", exampleEnglish: "It is my book." },
  { jp: "と", romaji: "to", job: "And, between nouns — or with, for a companion.", example: "友だちと行きます。", exampleEnglish: "I go with a friend." },
  { jp: "も", romaji: "mo", job: "Too, also. It replaces は or が.", example: "わたしも学生です。", exampleEnglish: "I am a student too." },
  { jp: "から", romaji: "kara", job: "From — a starting time or place.", example: "九時から始まります。", exampleEnglish: "It starts at nine." },
  { jp: "まで", romaji: "made", job: "Until, as far as — an ending time or place.", example: "五時まで働きます。", exampleEnglish: "I work until five." },
  { jp: "か", romaji: "ka", job: "Turns a sentence into a question.", example: "何時ですか。", exampleEnglish: "What time is it?" },
];

export type ParticleItem = {
  id: string;
  /** The sentence split into tappable pieces, in order. */
  chunks: string[];
  /** Which chunk is the particle being tested. */
  blank: number;
  /** The three wrong particles offered alongside the right one. */
  distractors: string[];
  english: string;
  romaji: string;
  /** Why the right one is right, shown after a miss. */
  note: string;
};

export const PARTICLE_ITEMS: readonly ParticleItem[] = [
  // は — topic
  { id: "wa-1", chunks: ["わたし", "は", "学生", "です"], blank: 1, distractors: ["が", "を", "に"],
    english: "I am a student.", romaji: "watashi wa gakusei desu",
    note: "は marks the topic — who or what the sentence is about. It is written ha but said wa." },
  { id: "wa-2", chunks: ["これ", "は", "本", "です"], blank: 1, distractors: ["を", "に", "で"],
    english: "This is a book.", romaji: "kore wa hon desu",
    note: "は introduces the topic, then です says what it is." },
  { id: "wa-3", chunks: ["きょう", "は", "月曜日", "です"], blank: 1, distractors: ["に", "の", "が"],
    english: "Today is Monday.", romaji: "kyou wa getsuyoubi desu",
    note: "Days like きょう take は as the topic. They do not take に." },

  // が — subject, existence, liking
  { id: "ga-1", chunks: ["へや", "に", "犬", "が", "います"], blank: 3, distractors: ["は", "を", "で"],
    english: "There is a dog in the room.", romaji: "heya ni inu ga imasu",
    note: "います and あります take が for the thing that exists." },
  { id: "ga-2", chunks: ["つくえ", "の", "上", "に", "本", "が", "あります"], blank: 5, distractors: ["を", "は", "で"],
    english: "There is a book on the desk.", romaji: "tsukue no ue ni hon ga arimasu",
    note: "あります is for things that do not move; the thing itself takes が." },
  { id: "ga-3", chunks: ["日本語", "が", "すき", "です"], blank: 1, distractors: ["を", "に", "も"],
    english: "I like Japanese.", romaji: "nihongo ga suki desu",
    note: "すき takes が, not を — in Japanese the liked thing is the subject." },

  // を — object
  { id: "o-1", chunks: ["パン", "を", "食べます"], blank: 1, distractors: ["が", "に", "で"],
    english: "I eat bread.", romaji: "pan o tabemasu",
    note: "を marks what the verb acts on. As a particle it is said o, never wo." },
  { id: "o-2", chunks: ["水", "を", "飲みます"], blank: 1, distractors: ["が", "は", "と"],
    english: "I drink water.", romaji: "mizu o nomimasu",
    note: "The thing being drunk is the object, so it takes を." },
  { id: "o-3", chunks: ["本", "を", "三冊", "読みます"], blank: 1, distractors: ["が", "に", "も"],
    english: "I read three books.", romaji: "hon o sansatsu yomimasu",
    note: "The counter 三冊 comes after を, not before the noun." },

  // に — time, destination, existence
  { id: "ni-1", chunks: ["三時", "に", "会いましょう"], blank: 1, distractors: ["は", "が", "で"],
    english: "Let's meet at three.", romaji: "sanji ni aimashou",
    note: "A clock time takes に for at." },
  { id: "ni-2", chunks: ["七時", "に", "起きます"], blank: 1, distractors: ["を", "が", "は"],
    english: "I get up at seven.", romaji: "shichiji ni okimasu",
    note: "に pins the action to a point in time." },
  { id: "ni-3", chunks: ["学校", "に", "行きます"], blank: 1, distractors: ["を", "が", "は"],
    english: "I go to school.", romaji: "gakkou ni ikimasu",
    note: "に marks the destination. (へ works here too, which is why it is not offered.)" },
  { id: "ni-4", chunks: ["きょうしつ", "に", "先生", "が", "います"], blank: 1, distractors: ["で", "を", "は"],
    english: "The teacher is in the classroom.", romaji: "kyoushitsu ni sensei ga imasu",
    note: "For simply existing somewhere, the place takes に — not で." },

  // で — place of action, means
  { id: "de-1", chunks: ["うち", "で", "食べます"], blank: 1, distractors: ["に", "を", "が"],
    english: "I eat at home.", romaji: "uchi de tabemasu",
    note: "で marks where an action happens. に would only mean existing there." },
  { id: "de-2", chunks: ["図書館", "で", "本", "を", "読みます"], blank: 1, distractors: ["に", "が", "と"],
    english: "I read books at the library.", romaji: "toshokan de hon o yomimasu",
    note: "Reading is an action, so the place takes で." },
  { id: "de-3", chunks: ["バス", "で", "行きます"], blank: 1, distractors: ["に", "を", "の"],
    english: "I go by bus.", romaji: "basu de ikimasu",
    note: "で also covers the means — by bus, by train, by hand." },
  { id: "de-4", chunks: ["はし", "で", "食べます"], blank: 1, distractors: ["を", "に", "も"],
    english: "I eat with chopsticks.", romaji: "hashi de tabemasu",
    note: "With a tool is で. と would mean together with the chopsticks." },

  // の — joining nouns
  { id: "no-1", chunks: ["わたし", "の", "本", "です"], blank: 1, distractors: ["は", "が", "を"],
    english: "It is my book.", romaji: "watashi no hon desu",
    note: "の joins two nouns: owner first, thing second." },
  { id: "no-2", chunks: ["日本", "の", "車", "です"], blank: 1, distractors: ["は", "で", "に"],
    english: "It is a Japanese car.", romaji: "nihon no kuruma desu",
    note: "の also says which kind: a car of Japan." },
  { id: "no-3", chunks: ["三時", "の", "電車", "です"], blank: 1, distractors: ["に", "は", "まで"],
    english: "It is the three o'clock train.", romaji: "sanji no densha desu",
    note: "Here the time describes the train, so it takes の, not に." },

  // と — and, with
  { id: "to-1", chunks: ["パン", "と", "たまご", "を", "食べます"], blank: 1, distractors: ["も", "の", "に"],
    english: "I eat bread and eggs.", romaji: "pan to tamago o tabemasu",
    note: "と is and between nouns — a complete list of them." },
  { id: "to-2", chunks: ["友だち", "と", "行きます"], blank: 1, distractors: ["を", "が", "で"],
    english: "I go with a friend.", romaji: "tomodachi to ikimasu",
    note: "と also means with, for the person you are with." },

  // も — too
  { id: "mo-1", chunks: ["わたし", "も", "学生", "です"], blank: 1, distractors: ["は", "が", "を"],
    english: "I am a student too.", romaji: "watashi mo gakusei desu",
    note: "も means too, and takes the place of は or が." },
  { id: "mo-2", chunks: ["これ", "も", "ください"], blank: 1, distractors: ["に", "で", "の"],
    english: "This one too, please.", romaji: "kore mo kudasai",
    note: "も adds this to something already mentioned." },

  // から / まで
  { id: "kara-1", chunks: ["九時", "から", "始まります"], blank: 1, distractors: ["まで", "に", "を"],
    english: "It starts at nine.", romaji: "kuji kara hajimarimasu",
    note: "から is from — the point something starts." },
  { id: "made-1", chunks: ["五時", "まで", "働きます"], blank: 1, distractors: ["から", "に", "で"],
    english: "I work until five.", romaji: "goji made hatarakimasu",
    note: "まで is until — the point something stops." },
  { id: "made-2", chunks: ["東京", "から", "大阪", "まで", "行きます"], blank: 3, distractors: ["に", "で", "と"],
    english: "I go from Tokyo to Osaka.", romaji: "toukyou kara oosaka made ikimasu",
    note: "から and まで pair up for from and to, with places as well as times." },

  // か — question
  { id: "ka-1", chunks: ["学生", "です", "か"], blank: 2, distractors: ["は", "が", "ね"],
    english: "Are you a student?", romaji: "gakusei desu ka",
    note: "か at the end turns a statement into a question. No question mark needed." },
  { id: "ka-2", chunks: ["何時", "です", "か"], blank: 2, distractors: ["の", "に", "を"],
    english: "What time is it?", romaji: "nanji desu ka",
    note: "Question words like 何時 still need か at the end." },
];

export type ParticleQuestion = {
  id: string;
  item: ParticleItem;
  /** Fill the gap: the four particles offered. */
  options?: string[];
  /** Put it in order: the pieces, shuffled. */
  tiles?: string[];
};

const shuffle = <T,>(xs: readonly T[], rng: () => number): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
};

/**
 * Each chunk's reading, in order. `romaji` is stored space-separated in the same order
 * as `chunks`, so this is a split rather than anything derived — and null when an item
 * ever breaks that alignment, so a caller shows nothing instead of readings sitting
 * under the wrong words. A test holds every item to the invariant.
 */
export function readingsOf(item: ParticleItem): string[] | null {
  const parts = item.romaji.trim().split(/\s+/);
  return parts.length === item.chunks.length ? parts : null;
}

/** What to speak for a particle on its own, which is not always how it is written. */
export const spokenForm = (p: ParticleInfo) => p.speak ?? p.jp;

export const answerOf = (item: ParticleItem) => item.chunks[item.blank]!;
export const sentenceOf = (item: ParticleItem) => item.chunks.join("");

/** The sentence with the tested particle replaced by a gap. */
export const gappedSentence = (item: ParticleItem) =>
  item.chunks.map((c, i) => (i === item.blank ? "＿" : c)).join("");

export function buildParticleRound(
  mode: ParticleModeId,
  { length = ROUND_LENGTH }: { length?: number } = {},
  rng: () => number = Math.random,
): ParticleQuestion[] {
  const pool = shuffle(PARTICLE_ITEMS, rng).slice(0, length);
  return pool.map((item) =>
    mode === "particle-pick"
      ? { id: item.id, item, options: shuffle([answerOf(item), ...item.distractors], rng) }
      : { id: item.id, item, tiles: shuffle(item.chunks, rng) },
  );
}

export function checkParticleAnswer(q: ParticleQuestion, mode: ParticleModeId, given: string | string[] | null): boolean {
  if (given === null) return false;
  if (mode === "particle-pick") return given === answerOf(q.item);
  return Array.isArray(given) && given.join("") === sentenceOf(q.item);
}
