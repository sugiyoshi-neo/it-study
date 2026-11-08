// 目次・セッションの並びを、統合済みの教材から組み立てる

import { FIELDS } from "./merge";
import type { Dialogue, LoadedPack, MergedTopic, Session } from "./types";

export type CategoryGroup = { category: string; topics: MergedTopic[] };
export type FieldGroup = { field: string; categories: CategoryGroup[] };

/** 分野 → 大分類 → トピックにまとめる(分野は FIELDS の順、大分類・トピックは教材に出てきた順) */
export function buildToc(topics: MergedTopic[]): FieldGroup[] {
  const byField = new Map<string, Map<string, CategoryGroup>>();
  for (const t of topics) {
    if (!byField.has(t.field)) byField.set(t.field, new Map());
    const cats = byField.get(t.field)!;
    if (!cats.has(t.category)) cats.set(t.category, { category: t.category, topics: [] });
    cats.get(t.category)!.topics.push(t);
  }
  const order = (f: string) => {
    const i = (FIELDS as readonly string[]).indexOf(f);
    return i < 0 ? FIELDS.length : i;
  };
  return [...byField.entries()]
    .sort(([a], [b]) => order(a) - order(b))
    .map(([field, cats]) => ({ field, categories: [...cats.values()] }));
}

/** パックの作成日(createdAt、なければファイル名の日付) */
function packDate(p: LoadedPack): string {
  return p.pack.createdAt ?? p.file.slice(0, 10);
}

/** セッションごとに、そのセッションが最後に教材パックへ入った日 */
export function sessionAddedDates(loaded: LoadedPack[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const p of loaded) {
    const d = packDate(p);
    for (const s of p.pack.sources ?? []) {
      const cur = out.get(s.key);
      if (!cur || d > cur) out.set(s.key, d);
    }
  }
  return out;
}

const byDateDesc = (a?: string, b?: string) => (b ?? "").localeCompare(a ?? "");

/** セッション一覧:日付の新しい順 */
export function sortSessions(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => byDateDesc(a.date, b.date) || a.key.localeCompare(b.key));
}

/** 最近追加されたセッション:パックに入った日の新しい順、同じ日ならセッションの日付の新しい順 */
export function recentSessions(sessions: Session[], addedAt: Map<string, string>, limit = 3): Session[] {
  return [...sessions]
    .sort((a, b) => byDateDesc(addedAt.get(a.key), addedAt.get(b.key)) || byDateDesc(a.date, b.date))
    .slice(0, limit);
}

export type SessionDialogue = { topic: MergedTopic; dialogue: Dialogue };

/** そのセッションのやりとりを、日付の古い順(同じ日なら教材に出てきた順)に集める */
export function dialoguesOfSession(topics: MergedTopic[], key: string): SessionDialogue[] {
  const list = topics.flatMap((topic) =>
    topic.dialogues.filter((d) => d.sourceKey === key).map((dialogue) => ({ topic, dialogue })),
  );
  // sort は安定ソートなので、同じ日付なら元の順番が保たれる
  return list.sort((a, b) => (a.dialogue.date ?? "").localeCompare(b.dialogue.date ?? ""));
}

/** そのセッションに関係するトピック(出典に含む、またはやりとりがある) */
export function topicsOfSession(topics: MergedTopic[], key: string): MergedTopic[] {
  return topics.filter((t) => t.sources.includes(key) || t.dialogues.some((d) => d.sourceKey === key));
}
