import { describe, expect, it } from "vitest";
import { getSearchIndex } from "./load";
import { buildIndex, search } from "./search";
import type { MergedTopic } from "./types";

const base: MergedTopic = {
  id: "t",
  title: "",
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
};

const topics: MergedTopic[] = [
  { ...base, id: "a", title: "キャッシュメモリ", summary: "CPUと主記憶の間に置く高速なメモリ" },
  {
    ...base,
    id: "b",
    title: "DMA",
    explanation: ["**DMA** は CPU を通さずに転送する"],
    dialogues: [
      {
        sourceKey: "s",
        title: "DMAとは",
        turns: [
          { role: "user", text: "DMAとは?" },
          { role: "assistant", text: "| 方式 | CPU |\n|---|---|\n| DMA | 使わない |" },
        ],
      },
    ],
    terms: [{ term: "キャッシュ", definition: "よく使うデータを置く場所" }],
  },
];

describe("search", () => {
  const index = buildIndex(topics);

  it("全角・半角、大文字・小文字を区別しない", () => {
    expect(search(index, "ｃｐｕ").map((r) => r.topic.id)).toEqual(search(index, "CPU").map((r) => r.topic.id));
    expect(search(index, "dma").map((r) => r.topic.id)).toEqual(["b"]);
  });

  it("タイトルに一致したトピックが先", () => {
    expect(search(index, "キャッシュ").map((r) => r.topic.id)).toEqual(["a", "b"]);
  });

  it("前後の文は、元の大文字・小文字のまま見せる", () => {
    const [r] = search(index, "cpu を通さず");
    expect(r.hits[0].snippet.match).toBe("CPU");
    expect(r.hits[0].snippet.before).toContain("DMA");
  });

  it("どこで一致したかと前後の文を返す。Markdown の記号は取り除く", () => {
    const [r] = search(index, "転送");
    expect(r.hits[0].section).toBe("explanation");
    expect(r.hits[0].snippet.match).toBe("転送");
    expect(r.hits[0].snippet.before).not.toContain("*");
    const d = search(index, "使わない")[0].hits[0];
    expect(d.section).toBe("dialogues");
    expect(d.label).toBe("やりとり「DMAとは」");
  });

  it("空白で区切ると、すべての語を含むものだけ", () => {
    expect(search(index, "CPU 転送").map((r) => r.topic.id)).toEqual(["b"]);
    expect(search(index, "  ")).toEqual([]);
    expect(search(index, "存在しない語")).toEqual([]);
  });

  it("実際の教材で、やりとりの中も検索できる", () => {
    const r = search(getSearchIndex(), "XOR");
    expect(r.length).toBeGreaterThan(0);
    expect(r.some((x) => x.hits.some((h) => h.section === "dialogues"))).toBe(true);
    expect(search(getSearchIndex(), "ｘｏｒ").map((x) => x.topic.id)).toEqual(r.map((x) => x.topic.id));
  });
});
