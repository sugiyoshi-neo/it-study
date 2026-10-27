import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { loadPacks, mergePacks as mergePacksJs } from "../../tools/content-lib.mjs";
import { mergePacks } from "./merge";
import { content } from "./load";
import type { LoadedPack } from "./types";

const packsDir = fileURLToPath(new URL("../../content/packs", import.meta.url));

describe("mergePacks(TS)と content-lib.mjs の一致", () => {
  it("実際の教材パックで同じ結果になる", () => {
    const loaded = loadPacks(packsDir) as LoadedPack[];
    expect(mergePacks(loaded)).toEqual(mergePacksJs(loaded));
  });

  it("アプリが import.meta.glob で読み込んだ結果も同じになる", () => {
    expect(content).toEqual(mergePacksJs(loadPacks(packsDir)));
  });

  it("同じ id のトピックは追記・上書きされ、重複しない", () => {
    const loaded = [
      {
        file: "2026-01-01_01_a.json",
        pack: {
          schemaVersion: 1,
          packId: "2026-01-01_01_a",
          title: "A",
          sources: [{ key: "s1", title: "セッション1" }],
          topics: [
            {
              id: "t1",
              title: "旧タイトル",
              field: "テクノロジ系",
              category: "基礎理論",
              summary: "旧要約",
              analogy: "旧たとえ",
              keyPoints: ["要点1"],
              terms: [{ term: "用語A", definition: "旧定義" }],
              pitfalls: [{ text: "つまずき1" }],
              formulas: [{ name: "式1", expr: "a+b" }],
              questions: [{ id: "q1", type: "numeric", prompt: "p", answer: 1, explanation: "e", origin: "original" }],
            },
          ],
          comparisons: [{ id: "c1", title: "旧", oneLiner: "旧", headers: [], rows: [] }],
          symbols: [{ id: "y1", symbol: "←", name: "旧", meaning: "旧" }],
          guides: [{ id: "g1", title: "旧", body: [] }],
        },
      },
      {
        file: "2026-01-02_01_b.json",
        pack: {
          schemaVersion: 1,
          packId: "2026-01-02_01_b",
          title: "B",
          sources: [
            { key: "s1", title: "セッション1(改)" },
            { key: "s2", title: "セッション2" },
          ],
          topics: [
            {
              id: "t1",
              title: "新タイトル",
              field: "テクノロジ系",
              category: "基礎理論",
              summary: "",
              analogy: null,
              keyPoints: ["要点1", "要点2"],
              terms: [
                { term: "用語A", definition: "新定義" },
                { term: "用語B", definition: "B" },
              ],
              pitfalls: [{ text: "つまずき1" }, { text: "つまずき2" }],
              formulas: [{ name: "式1", expr: "別の式" }],
              questions: [
                { id: "q1", type: "numeric", prompt: "p2", answer: 2, explanation: "e", origin: "original" },
                { id: "q2", type: "numeric", prompt: "p", answer: 3, explanation: "e", origin: "original" },
              ],
            },
            { id: "t2", title: "新規", field: "ストラテジ系", category: "経営", summary: "s" },
          ],
          comparisons: [{ id: "c1", title: "新", oneLiner: "新", headers: [], rows: [] }],
          symbols: [{ id: "y2", symbol: "mod", name: "余り", meaning: "m" }],
          guides: [{ id: "g1", title: "新", body: ["b"] }],
        },
      },
    ] as unknown as LoadedPack[];

    const ts = mergePacks(loaded);
    expect(ts).toEqual(mergePacksJs(loaded));

    const t1 = ts.topics.find((t) => t.id === "t1")!;
    expect(t1.title).toBe("新タイトル");
    expect(t1.summary).toBe("旧要約"); // 空文字では上書きしない
    expect(t1.analogy).toBe("旧たとえ"); // null では上書きしない
    expect(t1.keyPoints).toEqual(["要点1", "要点2"]);
    expect(t1.terms.map((x) => x.definition)).toEqual(["旧定義", "B"]); // term で重複除外(先勝ち)
    expect(t1.pitfalls).toHaveLength(2);
    expect(t1.formulas).toHaveLength(1); // name で重複除外
    expect(t1.questions.map((q) => q.prompt)).toEqual(["p", "p"]); // 問題 id で重複除外
    expect(ts.topics.find((t) => t.id === "t2")!.questions).toEqual([]);
    expect(ts.comparisons[0].title).toBe("新"); // 後勝ち
    expect(ts.symbols).toHaveLength(2);
    expect(ts.guides[0].title).toBe("新");
    expect(ts.sessions.map((s) => s.title)).toEqual(["セッション1(改)", "セッション2"]);
    expect(ts.mergeLog).toEqual(["t1: 2026-01-01_01_a.json に 2026-01-02_01_b.json を統合"]);
  });
});
