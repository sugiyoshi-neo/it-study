// 全文検索。トピック名・要約・解説・やりとり・用語などから探す。
// 教材は端末の中で十分速く探せる量なので、部分一致で探す(全角半角・大文字小文字は区別しない)。

import type { MergedTopic } from "./types";

/** トピック画面のセクション id(検索結果からその場所へ移動するのに使う) */
export type SectionId =
  | "analogy"
  | "summary"
  | "diagram"
  | "explanation"
  | "dialogues"
  | "pitfalls"
  | "terms"
  | "related"
  | "questions";

export type SearchEntry = {
  topic: MergedTopic;
  section: SectionId | null; // null はタイトル
  label: string;
  display: string; // 前後の文として見せる文(全角英数は半角にそろえる)
  text: string; // 検索用(display を小文字にしたもの)
};

export type Snippet = { before: string; match: string; after: string };

export type SearchHit = { section: SectionId | null; label: string; snippet: Snippet };

export type SearchResult = { topic: MergedTopic; hits: SearchHit[] };

export function normalize(s: string): string {
  return s.normalize("NFKC").toLowerCase();
}

/** Markdown の記号を取り除いて、前後の文として読みやすくする */
function plain(md: string): string {
  return md
    .replace(/```[a-z]*\n?/g, " ")
    .replace(/[*_`#>|]/g, " ")
    .replace(/<br\s*\/?>/g, " ")
    .replace(/-{3,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildIndex(topics: MergedTopic[]): SearchEntry[] {
  const out: SearchEntry[] = [];
  const add = (topic: MergedTopic, section: SectionId | null, label: string, text: string | undefined) => {
    if (!text || !text.trim()) return;
    const display = plain(text).normalize("NFKC");
    out.push({ topic, section, label, display, text: display.toLowerCase() });
  };
  for (const t of topics) {
    add(t, null, "タイトル", t.title);
    add(t, "analogy", "たとえ", t.analogy);
    add(t, "summary", "要約", [t.summary, ...t.keyPoints].join(" "));
    add(t, "explanation", "解説", [...t.explanation, ...t.formulas.map((f) => `${f.name} ${f.expr} ${f.note ?? ""}`)].join(" "));
    for (const d of t.dialogues) {
      add(t, "dialogues", `やりとり「${d.title}」`, [d.title, ...d.turns.map((x) => x.text)].join(" "));
    }
    add(t, "pitfalls", "あなたのつまずき", t.pitfalls.map((p) => p.text).join(" "));
    for (const term of t.terms) add(t, "terms", `用語「${term.term}」`, `${term.term} ${term.definition}`);
  }
  return out;
}

const SNIPPET_CHARS = 30;
const MAX_HITS_PER_TOPIC = 3;

function snippetOf(text: string, index: number, length: number): Snippet {
  const start = Math.max(0, index - SNIPPET_CHARS);
  const end = Math.min(text.length, index + length + SNIPPET_CHARS);
  return {
    before: (start > 0 ? "…" : "") + text.slice(start, index),
    match: text.slice(index, index + length),
    after: text.slice(index + length, end) + (end < text.length ? "…" : ""),
  };
}

/**
 * 空白で区切った語をすべて含む項目を探す。結果はトピックごとにまとめ、
 * タイトルに一致したトピックを先に、次に一致した項目の多い順に並べる
 */
export function search(index: SearchEntry[], query: string): SearchResult[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const byTopic = new Map<string, { topic: MergedTopic; hits: SearchHit[]; titleHit: boolean; count: number }>();
  for (const e of index) {
    if (!words.every((w) => e.text.includes(w))) continue;
    const r = byTopic.get(e.topic.id) ?? { topic: e.topic, hits: [], titleHit: false, count: 0 };
    r.count++;
    if (e.section === null) r.titleHit = true;
    else if (r.hits.length < MAX_HITS_PER_TOPIC) {
      // 小文字にしても長さが変わらなければ、元の大文字・小文字のまま見せる(ほぼすべての文字はこちら)
      const shown = e.display.length === e.text.length ? e.display : e.text;
      r.hits.push({ section: e.section, label: e.label, snippet: snippetOf(shown, e.text.indexOf(words[0]), words[0].length) });
    }
    byTopic.set(e.topic.id, r);
  }
  return [...byTopic.values()]
    .sort((a, b) => Number(b.titleHit) - Number(a.titleHit) || b.count - a.count)
    .map(({ topic, hits }) => ({ topic, hits }));
}
