import { describe, expect, it } from "vitest";
import { content } from "./load";
import { buildToc, dialoguesOfSession, recentSessions, sessionAddedDates, sortSessions, topicsOfSession } from "./structure";
import type { LoadedPack, MergedTopic } from "./types";

const topic = (id: string, over: Partial<MergedTopic> = {}): MergedTopic => ({
  id,
  title: id,
  field: "テクノロジ系",
  category: "基礎理論",
  summary: "",
  sources: [],
  keyPoints: [],
  explanation: [],
  formulas: [],
  pitfalls: [],
  prerequisites: [],
  related: [],
  terms: [],
  questions: [],
  dialogues: [],
  ...over,
});

describe("buildToc", () => {
  it("分野は決まった順、大分類とトピックは出てきた順", () => {
    const toc = buildToc([
      topic("a", { field: "実務・IT用語", category: "AI" }),
      topic("b", { category: "ネットワーク" }),
      topic("c", { category: "基礎理論" }),
      topic("d", { category: "ネットワーク" }),
    ]);
    expect(toc.map((f) => f.field)).toEqual(["テクノロジ系", "実務・IT用語"]);
    expect(toc[0].categories.map((c) => [c.category, c.topics.map((t) => t.id)])).toEqual([
      ["ネットワーク", ["b", "d"]],
      ["基礎理論", ["c"]],
    ]);
  });

  it("実際の教材で全トピックが目次に1回ずつ出る", () => {
    const ids = buildToc(content.topics).flatMap((f) => f.categories.flatMap((c) => c.topics.map((t) => t.id)));
    expect(ids.sort()).toEqual(content.topics.map((t) => t.id).sort());
  });
});

describe("セッション", () => {
  const sessions = [
    { key: "old", title: "古い", date: "2026-10-01" },
    { key: "new", title: "新しい", date: "2026-10-20" },
    { key: "mid", title: "中", date: "2026-10-10" },
  ];

  it("一覧は日付の新しい順", () => {
    expect(sortSessions(sessions).map((s) => s.key)).toEqual(["new", "mid", "old"]);
  });

  it("最近追加されたセッションは、パックに入った日の新しい順", () => {
    const loaded = [
      { file: "2026-10-21_01_a.json", pack: { createdAt: "2026-10-21", sources: [sessions[1], sessions[2]] } },
      { file: "2026-11-01_01_b.json", pack: { sources: [sessions[0]] } }, // createdAt がなければファイル名の日付
    ] as unknown as LoadedPack[];
    const added = sessionAddedDates(loaded);
    expect(added.get("old")).toBe("2026-11-01");
    expect(recentSessions(sessions, added, 2).map((s) => s.key)).toEqual(["old", "new"]);
  });

  it("やりとりは日付の古い順、同じ日なら出てきた順", () => {
    const turns = [{ role: "user" as const, text: "q" }];
    const topics = [
      topic("t1", {
        dialogues: [
          { sourceKey: "s", date: "2026-10-02", title: "2日目A", turns },
          { sourceKey: "x", date: "2026-10-01", title: "別セッション", turns },
        ],
      }),
      topic("t2", {
        sources: ["s"],
        dialogues: [
          { sourceKey: "s", date: "2026-10-01", title: "1日目", turns },
          { sourceKey: "s", date: "2026-10-02", title: "2日目B", turns },
        ],
      }),
      topic("t3", { sources: ["s"] }),
    ];
    expect(dialoguesOfSession(topics, "s").map((d) => d.dialogue.title)).toEqual(["1日目", "2日目A", "2日目B"]);
    expect(topicsOfSession(topics, "s").map((t) => t.id)).toEqual(["t1", "t2", "t3"]);
  });
});
