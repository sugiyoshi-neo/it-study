// 演習の判定と出題の組み立て(画面から切り離してテストできるようにしている)

import type { QuestionEntry } from "../content/load";
import type { Question } from "../content/types";

/** 全角数字・全角記号・桁区切りを含む入力を数値にする。数値でなければ null */
export function parseNumber(input: string): number | null {
  const s = input
    .replace(/[０-９．－＋]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[ー−]/g, "-")
    .replace(/[,，\s]/g, "");
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  return Number(s);
}

/** 回答が正しいか。choice は選択肢 id、numeric は入力文字列を渡す */
export function isCorrect(question: Question, answer: string): boolean {
  if (question.type === "choice") return answer === question.answer;
  const n = parseNumber(answer);
  if (n === null) return false;
  // 0.1 + 0.2 のような小数の誤差で不正解にならないよう、わずかな余裕を持たせる
  return Math.abs(n - question.answer) <= (question.tolerance ?? 0) + 1e-9;
}

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export type PracticeMode = "random" | "category" | "topic";

export const SESSION_SIZE = 10;

/**
 * 出題する問題を選ぶ
 * - random:全問題からランダムに10問
 * - category:その大分類からランダムに最大10問
 * - topic:そのトピックの問題を順番どおり全部
 */
export function pickQuestions(
  all: QuestionEntry[],
  mode: PracticeMode,
  key: string | null,
  random: () => number = Math.random,
): QuestionEntry[] {
  switch (mode) {
    case "random":
      return shuffle(all, random).slice(0, SESSION_SIZE);
    case "category":
      return shuffle(
        all.filter((e) => e.topic.category === key),
        random,
      ).slice(0, SESSION_SIZE);
    case "topic":
      return all.filter((e) => e.topic.id === key);
  }
}

export function isPracticeMode(v: string | null): v is PracticeMode {
  return v === "random" || v === "category" || v === "topic";
}
