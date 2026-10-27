import { describe, expect, it } from "vitest";
import { allQuestions } from "../content/load";
import type { ChoiceQuestion, NumericQuestion } from "../content/types";
import { isCorrect, parseNumber, pickQuestions, SESSION_SIZE } from "./logic";

const numeric = (answer: number, tolerance?: number): NumericQuestion => ({
  id: "q",
  type: "numeric",
  prompt: "",
  explanation: "",
  origin: "original",
  answer,
  tolerance,
});

describe("parseNumber", () => {
  it("半角・全角・桁区切り・負の数を読める", () => {
    expect(parseNumber("0.375")).toBe(0.375);
    expect(parseNumber("０．３７５")).toBe(0.375);
    expect(parseNumber("1,024")).toBe(1024);
    expect(parseNumber(" -5 ")).toBe(-5);
    expect(parseNumber("ー5")).toBe(-5);
    expect(parseNumber(".5")).toBe(0.5);
  });
  it("数値でなければ null", () => {
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("abc")).toBeNull();
    expect(parseNumber("1.2.3")).toBeNull();
    expect(parseNumber("-")).toBeNull();
  });
});

describe("isCorrect", () => {
  it("choice は選択肢 id で判定", () => {
    const q = { type: "choice", answer: "イ" } as ChoiceQuestion;
    expect(isCorrect(q, "イ")).toBe(true);
    expect(isCorrect(q, "エ")).toBe(false);
  });
  it("numeric は tolerance 以内なら正解", () => {
    expect(isCorrect(numeric(0.375), "0.375")).toBe(true);
    expect(isCorrect(numeric(0.375), "0.38")).toBe(false);
    expect(isCorrect(numeric(0.3), String(0.1 + 0.2))).toBe(true);
    expect(isCorrect(numeric(100, 0.5), "100.5")).toBe(true);
    expect(isCorrect(numeric(100, 0.5), "101")).toBe(false);
    expect(isCorrect(numeric(1), "")).toBe(false);
  });
});

describe("pickQuestions", () => {
  it("random は重複なしで10問", () => {
    const picked = pickQuestions(allQuestions, "random", null);
    expect(picked).toHaveLength(SESSION_SIZE);
    expect(new Set(picked.map((e) => e.question.id)).size).toBe(SESSION_SIZE);
  });
  it("category はその大分類だけ", () => {
    const picked = pickQuestions(allQuestions, "category", "基礎理論");
    expect(picked.length).toBeGreaterThan(0);
    expect(picked.length).toBeLessThanOrEqual(SESSION_SIZE);
    expect(picked.every((e) => e.topic.category === "基礎理論")).toBe(true);
  });
  it("topic はそのトピックの問題を順番どおり全部", () => {
    const topicId = allQuestions[0].topic.id;
    const expected = allQuestions.filter((e) => e.topic.id === topicId).map((e) => e.question.id);
    expect(pickQuestions(allQuestions, "topic", topicId).map((e) => e.question.id)).toEqual(expected);
  });
  it("存在しない key なら0問", () => {
    expect(pickQuestions(allQuestions, "category", "存在しない")).toEqual([]);
  });
});
