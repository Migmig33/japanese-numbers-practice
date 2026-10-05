export type SetId =
  | "ones" | "teens-tens" | "hundreds" | "thousands" | "tenthousands" | "native"
  | "hours" | "minutes" | "half" | "ampm" | "question";

export type Item = {
  id: string;
  jp: string;            // 六百
  readings: string[];    // every accepted reading, normalized form
  kana: string[];        // the same readings in hiragana, one per reading
  set: SetId;
  kind: "number" | "hour" | "minute" | "modifier";
  value?: number;
  note?: string;         // rule shown when the user misses it
};

/** What feedback and review lists need to show an answer. */
export type ReviewItem = Pick<Item, "id" | "jp" | "readings" | "note">;
