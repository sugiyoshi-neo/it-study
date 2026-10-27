#!/usr/bin/env node
// 教材パックの検査スクリプト
// 使い方:
//   node tools/validate.mjs            … 検査だけ
//   node tools/validate.mjs --index    … 検査して content/topic-index.md を書き出す
//                                        (新しいセッションを追加するとき、チャットに渡す一覧)

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPacks, mergePacks, STUMBLE_TAGS, FIELDS } from "./content-lib.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const packsDir = join(root, "content", "packs");

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const loaded = loadPacks(packsDir);

// ---- パック単位の検査 ----
const questionIds = new Map();
for (const { file, pack } of loaded) {
  if (pack.schemaVersion !== 1) err(`${file}: schemaVersion は 1 にしてください`);
  if (!pack.packId) err(`${file}: packId がありません`);
  if (pack.packId && `${pack.packId}.json` !== file) warn(`${file}: packId(${pack.packId})とファイル名が一致しません`);
  const sourceKeys = new Set((pack.sources ?? []).map((s) => s.key));

  for (const t of pack.topics ?? []) {
    const where = `${file} / ${t.id}`;
    if (!t.id || !/^[a-z0-9-]+$/.test(t.id)) err(`${where}: id は英小文字・数字・ハイフンのみ`);
    for (const s of t.sources ?? []) if (!sourceKeys.has(s)) err(`${where}: sources の "${s}" がパックの sources にありません`);
    for (const p of t.pitfalls ?? []) {
      if (p.sourceKey && !sourceKeys.has(p.sourceKey)) err(`${where}: pitfalls の sourceKey "${p.sourceKey}" が未定義`);
    }

    for (const q of t.questions ?? []) {
      const qw = `${where} / ${q.id}`;
      if (!q.id) { err(`${where}: id のない問題があります`); continue; }
      if (questionIds.has(q.id)) err(`${qw}: 問題 id が重複(${questionIds.get(q.id)} にもあります)`);
      questionIds.set(q.id, file);
      if (!q.prompt) err(`${qw}: prompt がありません`);
      if (!q.explanation) err(`${qw}: explanation がありません`);
      if (q.type === "choice") {
        const ids = (q.choices ?? []).map((c) => c.id);
        if (ids.length < 2) err(`${qw}: 選択肢が2つ未満`);
        if (new Set(ids).size !== ids.length) err(`${qw}: 選択肢 id が重複`);
        if (!ids.includes(q.answer)) err(`${qw}: answer "${q.answer}" が選択肢にありません`);
        for (const k of Object.keys(q.wrongReasons ?? {})) {
          if (!ids.includes(k)) err(`${qw}: wrongReasons の "${k}" が選択肢にありません`);
          if (k === q.answer) err(`${qw}: 正解の選択肢に wrongReasons が付いています`);
        }
      } else if (q.type === "numeric") {
        if (typeof q.answer !== "number") err(`${qw}: numeric の answer は数値にしてください`);
      } else {
        err(`${qw}: type は "choice" か "numeric"`);
      }
      for (const tag of q.stumbleTags ?? []) if (!(tag in STUMBLE_TAGS)) err(`${qw}: 不明なつまずきタグ "${tag}"`);
      if (!["session", "session-reconstructed", "original"].includes(q.origin)) err(`${qw}: origin が不正`);
      if (q.origin !== "original" && !q.sourceKey) warn(`${qw}: セッション由来なのに sourceKey がありません`);
      if (q.sourceKey && !sourceKeys.has(q.sourceKey)) err(`${qw}: sourceKey "${q.sourceKey}" が未定義`);
    }
  }
}

// ---- 統合後の検査 ----
const merged = mergePacks(loaded);
const topicIds = new Set(merged.topics.map((t) => t.id));

for (const t of merged.topics) {
  if (!t.title) err(`${t.id}: title がありません`);
  if (!FIELDS.includes(t.field)) err(`${t.id}: field "${t.field}" は ${FIELDS.join(" / ")} のいずれか`);
  if (!t.category) err(`${t.id}: category がありません`);
  if (!t.summary) err(`${t.id}: summary がありません`);
  for (const p of t.prerequisites ?? []) if (!topicIds.has(p)) err(`${t.id}: 前提トピック "${p}" が存在しません`);
  for (const r of t.related ?? []) if (!topicIds.has(r)) warn(`${t.id}: 関連トピック "${r}" が存在しません`);
  if ((t.prerequisites ?? []).includes(t.id)) err(`${t.id}: 自分自身を前提にしています`);
  if ((t.questions ?? []).length === 0) warn(`${t.id}: 問題が0問です`);
}
for (const c of merged.comparisons) for (const id of c.topicIds ?? []) if (!topicIds.has(id)) err(`比較 ${c.id}: トピック "${id}" が存在しません`);
for (const s of merged.symbols) for (const id of s.topicIds ?? []) if (!topicIds.has(id)) err(`記号 ${s.id}: トピック "${id}" が存在しません`);

// 前提トピックの循環チェック
const prereq = new Map(merged.topics.map((t) => [t.id, t.prerequisites ?? []]));
const state = new Map();
function visit(id, path) {
  if (state.get(id) === 2) return;
  if (state.get(id) === 1) { err(`前提トピックが循環しています: ${[...path, id].join(" → ")}`); return; }
  state.set(id, 1);
  for (const p of prereq.get(id) ?? []) visit(p, [...path, id]);
  state.set(id, 2);
}
for (const id of prereq.keys()) visit(id, []);

// ---- 結果 ----
const qCount = merged.topics.reduce((n, t) => n + (t.questions?.length ?? 0), 0);
const missed = merged.topics.reduce((n, t) => n + (t.questions ?? []).filter((q) => q.missedInSession).length, 0);
console.log(`パック ${loaded.length} 件 / トピック ${merged.topics.length} 件 / 問題 ${qCount} 問(うちセッションで誤答 ${missed} 問)`);
console.log(`比較カード ${merged.comparisons.length} 件 / 記号 ${merged.symbols.length} 件 / ガイド ${merged.guides.length} 件`);
if (merged.mergeLog.length) console.log(`統合:\n  ${merged.mergeLog.join("\n  ")}`);
if (warnings.length) console.log(`\n警告 ${warnings.length} 件:\n  ${warnings.join("\n  ")}`);
if (errors.length) {
  console.error(`\nエラー ${errors.length} 件:\n  ${errors.join("\n  ")}`);
  process.exit(1);
}
console.log("\nOK:エラーはありません");

if (process.argv.includes("--index")) {
  const byField = new Map();
  for (const t of merged.topics) {
    const key = `${t.field} / ${t.category}`;
    if (!byField.has(key)) byField.set(key, []);
    byField.get(key).push(t);
  }
  const lines = [
    "# トピック一覧(チャットに渡す用)",
    "",
    `生成:${new Date().toISOString().slice(0, 10)} / トピック ${merged.topics.length} 件 / 問題 ${qCount} 問`,
    "",
    "新しいセッションを追加するとき、このファイルをチャットに渡すと、既存トピックへの追記(同じ id)と新規トピックを正しく使い分けられます。",
    "",
    "## 使用済みの問題 id の接頭辞",
    "",
    [...new Set([...questionIds.keys()].map((id) => id.replace(/-\d+$/, "")))].sort().join(", "),
    "",
    "## トピック",
    "",
  ];
  for (const [key, ts] of [...byField.entries()].sort()) {
    lines.push(`### ${key}`, "");
    for (const t of ts) lines.push(`- \`${t.id}\` ${t.title}(問題 ${t.questions?.length ?? 0})`);
    lines.push("");
  }
  lines.push("## セッション(sources の key)", "");
  for (const s of merged.sessions) lines.push(`- \`${s.key}\` ${s.title}`);
  writeFileSync(join(root, "content", "topic-index.md"), lines.join("\n") + "\n");
  console.log("content/topic-index.md を書き出しました");
}
