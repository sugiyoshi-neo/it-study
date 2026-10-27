// 教材パックの統合ロジック。tools/content-lib.mjs の mergePacks を TypeScript に移植したもの。
// ルールを変えるときは content-lib.mjs が正。merge.test.ts で同じ結果になることを確かめる。

import type { Comparison, Guide, LoadedPack, MergedContent, MergedTopic, Session, SymbolEntry } from "./types";

export const STUMBLE_TAGS = {
  reading: "問題文・用語の読解",
  symbol: "記号・図の読み方",
  prerequisite: "前提知識の不足",
  why: "「なぜ」の理解",
  confusion: "似た概念の混同",
  trap: "ひっかけ",
  calc: "計算・式の立て方",
  trace: "手順のトレース",
} as const;

export const FIELDS = ["テクノロジ系", "マネジメント系", "ストラテジ系", "実務・IT用語"] as const;

const ARRAY_FIELDS = [
  "sources",
  "keyPoints",
  "explanation",
  "formulas",
  "pitfalls",
  "prerequisites",
  "related",
  "terms",
  "questions",
] as const;
const SCALAR_FIELDS = ["title", "field", "category", "level", "summary", "analogy", "diagram"] as const;

type Loose = Record<string, unknown>;

function keyOf(item: unknown): string {
  if (item === null || typeof item !== "object") return JSON.stringify(item);
  if ("id" in item) return `id:${(item as Loose).id}`;
  if ("term" in item) return `term:${(item as Loose).term}`;
  if ("name" in item) return `name:${(item as Loose).name}`;
  if ("text" in item) return `text:${(item as Loose).text}`;
  return JSON.stringify(item);
}

function appendUnique(base: unknown[], extra: unknown[]): unknown[] {
  const seen = new Set(base.map(keyOf));
  const out = [...base];
  for (const item of extra) {
    const k = keyOf(item);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(item);
    }
  }
  return out;
}

/**
 * 統合ルール(ファイル名順に適用)
 * - topics は id で統合する。後のパックに同じ id があれば:
 *   - 配列フィールドは追記(重複は除く。問題は id、用語は term で判定)
 *   - スカラーフィールドは、後のパックで値があれば上書き
 * - comparisons / symbols / guides は id で統合し、後のパックが丸ごと上書き
 * - sources(セッション一覧)は key で統合
 */
export function mergePacks(loaded: LoadedPack[]): MergedContent {
  const topics = new Map<string, Loose>();
  const topicOrigin = new Map<string, string>();
  const comparisons = new Map<string, Comparison>();
  const symbols = new Map<string, SymbolEntry>();
  const guides = new Map<string, Guide>();
  const sessions = new Map<string, Session>();
  const mergeLog: string[] = [];

  for (const { file, pack } of loaded) {
    for (const s of pack.sources ?? []) sessions.set(s.key, s);

    for (const topic of pack.topics ?? []) {
      const t = topic as unknown as Loose;
      if (!topics.has(topic.id)) {
        const fresh: Loose = { ...t };
        for (const f of ARRAY_FIELDS) fresh[f] = [...((t[f] as unknown[] | undefined) ?? [])];
        topics.set(topic.id, fresh);
        topicOrigin.set(topic.id, file);
        continue;
      }
      const cur = topics.get(topic.id)!;
      mergeLog.push(`${topic.id}: ${topicOrigin.get(topic.id)} に ${file} を統合`);
      for (const f of SCALAR_FIELDS) {
        if (t[f] !== undefined && t[f] !== "" && t[f] !== null) cur[f] = t[f];
      }
      for (const f of ARRAY_FIELDS) {
        cur[f] = appendUnique((cur[f] as unknown[] | undefined) ?? [], (t[f] as unknown[] | undefined) ?? []);
      }
    }

    for (const c of pack.comparisons ?? []) comparisons.set(c.id, c);
    for (const s of pack.symbols ?? []) symbols.set(s.id, s);
    for (const g of pack.guides ?? []) guides.set(g.id, g);
  }

  return {
    topics: [...topics.values()] as unknown as MergedTopic[],
    comparisons: [...comparisons.values()],
    symbols: [...symbols.values()],
    guides: [...guides.values()],
    sessions: [...sessions.values()],
    mergeLog,
  };
}
