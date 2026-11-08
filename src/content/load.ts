// ビルド時に content/packs/*.json をすべて読み込み、統合する。
// パックを足すだけでアプリに反映されるように、ファイル名を直接書かない。

import { mergePacks } from "./merge";
import { buildIndex, type SearchEntry } from "./search";
import { sessionAddedDates } from "./structure";
import type { LoadedPack, MergedTopic, Pack, Question, Session } from "./types";

const modules = import.meta.glob<Pack>("/content/packs/*.json", { eager: true, import: "default" });

/** glob の結果を、content-lib.mjs の loadPacks と同じくファイル名順に並べる */
export function toLoadedPacks(mods: Record<string, Pack>): LoadedPack[] {
  return Object.entries(mods)
    .map(([path, pack]) => ({ file: path.slice(path.lastIndexOf("/") + 1), pack }))
    .sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));
}

const loaded = toLoadedPacks(modules);

export const content = mergePacks(loaded);

export const topicById = new Map<string, MergedTopic>(content.topics.map((t) => [t.id, t]));

export const sessionByKey = new Map<string, Session>(content.sessions.map((s) => [s.key, s]));

export const sessionAddedAt = sessionAddedDates(loaded);

export type QuestionEntry = { question: Question; topic: MergedTopic };

export const allQuestions: QuestionEntry[] = content.topics.flatMap((topic) =>
  topic.questions.map((question) => ({ question, topic })),
);

let searchIndex: SearchEntry[] | undefined;

/** 検索用の索引(最初に検索したときに作る) */
export function getSearchIndex(): SearchEntry[] {
  searchIndex ??= buildIndex(content.topics);
  return searchIndex;
}
