// しおり・既読・続きから読むを、端末(localStorage)に保存する。
// トピック id で紐づけるので、教材パックが増えても消えない。

import { useSyncExternalStore } from "react";

export type ReadingState = {
  bookmarks: string[]; // しおりを付けた順
  read: Record<string, string>; // トピック id → 読み終えた日(YYYY-MM-DD)
  lastTopicId?: string;
};

const STORAGE_KEY = "it-study:reading:v1";
const EMPTY: ReadingState = { bookmarks: [], read: {} };

export function parseState(raw: string | null): ReadingState {
  if (!raw) return EMPTY;
  try {
    const v = JSON.parse(raw);
    return {
      bookmarks: Array.isArray(v.bookmarks) ? v.bookmarks.filter((x: unknown) => typeof x === "string") : [],
      read: v.read && typeof v.read === "object" ? v.read : {},
      lastTopicId: typeof v.lastTopicId === "string" ? v.lastTopicId : undefined,
    };
  } catch {
    return EMPTY;
  }
}

export function toggleBookmark(s: ReadingState, id: string): ReadingState {
  return s.bookmarks.includes(id)
    ? { ...s, bookmarks: s.bookmarks.filter((b) => b !== id) }
    : { ...s, bookmarks: [...s.bookmarks, id] };
}

export function setRead(s: ReadingState, id: string, read: boolean, today: string): ReadingState {
  const next = { ...s.read };
  if (read) next[id] = today;
  else delete next[id];
  return { ...s, read: next };
}

export function setLastTopic(s: ReadingState, id: string): ReadingState {
  return s.lastTopicId === id ? s : { ...s, lastTopicId: id };
}

export function todayString(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// ---- React から使うための保存と通知 ----

function readStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // プライベートブラウズなどで使えないときは、保存なしで動かす
  }
}

let current: ReadingState = parseState(typeof localStorage === "undefined" ? null : readStorage());
const listeners = new Set<() => void>();

function update(fn: (s: ReadingState) => ReadingState) {
  const next = fn(current);
  if (next === current) return;
  current = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // 保存できなくても、開いている間は使えるようにする
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

// 画面から呼ぶ操作。毎回同じ関数を渡せるように、フックの外で作っておく
const actions = {
  toggleBookmark: (id: string) => update((s) => toggleBookmark(s, id)),
  setRead: (id: string, read: boolean) => update((s) => setRead(s, id, read, todayString())),
  setLastTopic: (id: string) => update((s) => setLastTopic(s, id)),
};

export function useReading() {
  const state = useSyncExternalStore(subscribe, () => current);
  return { state, ...actions };
}
