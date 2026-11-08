import { describe, expect, it } from "vitest";
import { parseState, setLastTopic, setRead, todayString, toggleBookmark } from "./storage";

describe("しおり・既読の保存データ", () => {
  it("壊れたデータや空でも、空の状態として読める", () => {
    expect(parseState(null)).toEqual({ bookmarks: [], read: {} });
    expect(parseState("{壊れた")).toEqual({ bookmarks: [], read: {} });
    expect(parseState(JSON.stringify({ bookmarks: ["a", 1], read: { a: "2026-11-08" }, lastTopicId: "a" }))).toEqual({
      bookmarks: ["a"],
      read: { a: "2026-11-08" },
      lastTopicId: "a",
    });
  });

  it("しおりは付けた順に並び、もう一度押すと外れる", () => {
    let s = parseState(null);
    s = toggleBookmark(s, "a");
    s = toggleBookmark(s, "b");
    expect(s.bookmarks).toEqual(["a", "b"]);
    expect(toggleBookmark(s, "a").bookmarks).toEqual(["b"]);
  });

  it("既読は日付つきで付け外しできる", () => {
    const s = setRead(parseState(null), "a", true, "2026-11-08");
    expect(s.read).toEqual({ a: "2026-11-08" });
    expect(setRead(s, "a", false, "2026-11-09").read).toEqual({});
  });

  it("続きから読むは最後に開いたトピック。同じなら状態を変えない", () => {
    const s = setLastTopic(parseState(null), "a");
    expect(s.lastTopicId).toBe("a");
    expect(setLastTopic(s, "a")).toBe(s);
  });

  it("日付は YYYY-MM-DD", () => {
    expect(todayString(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});
