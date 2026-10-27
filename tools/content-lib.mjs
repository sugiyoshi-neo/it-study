// 教材パックの読み込み・統合ロジック(検査スクリプトとアプリで同じルールを使う)
// アプリ側では、このロジックを TypeScript に移植して使ってください(docs/SPEC.md 参照)。

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export const STUMBLE_TAGS = {
  reading: "問題文・用語の読解",
  symbol: "記号・図の読み方",
  prerequisite: "前提知識の不足",
  why: "「なぜ」の理解",
  confusion: "似た概念の混同",
  trap: "ひっかけ",
  calc: "計算・式の立て方",
  trace: "手順のトレース",
};

export const FIELDS = ["テクノロジ系", "マネジメント系", "ストラテジ系", "実務・IT用語"];

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
];
const SCALAR_FIELDS = ["title", "field", "category", "level", "summary", "analogy", "diagram"];

/** packs フォルダの JSON をファイル名順に読み込む */
export function loadPacks(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((file) => ({ file, pack: JSON.parse(readFileSync(join(dir, file), "utf8")) }));
}

function keyOf(item) {
  if (item === null || typeof item !== "object") return JSON.stringify(item);
  if ("id" in item) return `id:${item.id}`;
  if ("term" in item) return `term:${item.term}`;
  if ("name" in item) return `name:${item.name}`;
  if ("text" in item) return `text:${item.text}`;
  return JSON.stringify(item);
}

function appendUnique(base, extra) {
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
export function mergePacks(loaded) {
  const topics = new Map();
  const topicOrigin = new Map();
  const comparisons = new Map();
  const symbols = new Map();
  const guides = new Map();
  const sessions = new Map();
  const mergeLog = [];

  for (const { file, pack } of loaded) {
    for (const s of pack.sources ?? []) sessions.set(s.key, s);

    for (const t of pack.topics ?? []) {
      if (!topics.has(t.id)) {
        const fresh = { ...t };
        for (const f of ARRAY_FIELDS) fresh[f] = [...(t[f] ?? [])];
        topics.set(t.id, fresh);
        topicOrigin.set(t.id, file);
        continue;
      }
      const cur = topics.get(t.id);
      mergeLog.push(`${t.id}: ${topicOrigin.get(t.id)} に ${file} を統合`);
      for (const f of SCALAR_FIELDS) {
        if (t[f] !== undefined && t[f] !== "" && t[f] !== null) cur[f] = t[f];
      }
      for (const f of ARRAY_FIELDS) cur[f] = appendUnique(cur[f] ?? [], t[f] ?? []);
    }

    for (const c of pack.comparisons ?? []) comparisons.set(c.id, c);
    for (const s of pack.symbols ?? []) symbols.set(s.id, s);
    for (const g of pack.guides ?? []) guides.set(g.id, g);
  }

  return {
    topics: [...topics.values()],
    comparisons: [...comparisons.values()],
    symbols: [...symbols.values()],
    guides: [...guides.values()],
    sessions: [...sessions.values()],
    mergeLog,
  };
}
