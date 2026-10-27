# 教材データの形式(schemaVersion 1)

教材は `content/packs/` に JSON ファイル(パック)として置きます。ファイル名は `YYYY-MM-DD_連番_内容.json`。アプリはファイル名順に読み込んで統合します。

## パック

```jsonc
{
  "schemaVersion": 1,
  "packId": "2026-11-03_01_fe5",      // ファイル名(拡張子なし)と同じ
  "title": "基本情報5",
  "createdAt": "2026-11-03",
  "sources": [                          // 元になったチャットのセッション
    { "key": "fe5", "title": "基本情報5", "url": "https://claude.ai/chat/...", "date": "2026-11-02" }
  ],
  "topics": [ /* トピック */ ],
  "comparisons": [ /* 比較カード(任意) */ ],
  "symbols": [ /* 記号辞典(任意) */ ],
  "guides": [ /* ガイド(任意) */ ]
}
```

## トピック

| フィールド | 必須 | 内容 |
|---|---|---|
| `id` | ○ | 英小文字・数字・ハイフン。全パックで一意。**既存と同じ id にすると、そのトピックへの追記になる** |
| `title` | ○ | タイトル |
| `field` | ○ | `テクノロジ系` / `マネジメント系` / `ストラテジ系` / `実務・IT用語` |
| `category` | ○ | 大分類(基本情報のシラバスに合わせる。例:基礎理論、アルゴリズムとプログラミング、ネットワーク) |
| `level` | | 1〜3(難しさ) |
| `sources` | | このトピックの出典セッションの key(パックの `sources` で定義したもの) |
| `summary` | ○ | 1〜2文の要約 |
| `analogy` | | たとえ話 |
| `keyPoints` | | 要点(文字列の配列) |
| `diagram` | | `{ "type": "mermaid", "code": "..." }` |
| `explanation` | | 解説。Markdown 文字列の配列(1要素 = 1ブロック) |
| `formulas` | | `{ name, expr, note? }` の配列 |
| `pitfalls` | | 利用者がつまずいた点。`{ text, sourceKey? }` の配列 |
| `prerequisites` | | 前提トピックの id。存在しない id はエラー。循環もエラー |
| `related` | | 関連トピックの id |
| `terms` | | `{ term, definition }` の配列 |
| `questions` | | 問題の配列 |

## 問題

| フィールド | 必須 | 内容 |
|---|---|---|
| `id` | ○ | 全パックで一意(例:`q-hash-5`) |
| `type` | ○ | `choice`(選択)か `numeric`(数値入力) |
| `prompt` | ○ | 問題文 |
| `choices` | choice のとき○ | `{ id, text }` の配列。id はア・イ・ウ・エ など |
| `answer` | ○ | choice は正解の選択肢 id、numeric は数値 |
| `tolerance` | | numeric の許容誤差(既定 0) |
| `unit` | | numeric の単位(表示用) |
| `explanation` | ○ | 解説 |
| `readingAid` | | 問題文の言い換え(「問題文を言い換える」ボタンで表示) |
| `wrongReasons` | | `{ "選択肢id": "この選択肢を選んだときに考えがちなこと" }`。正解には付けない |
| `stumbleTags` | | つまずきタグ(下表)の配列 |
| `origin` | ○ | `session`(原文どおり)/ `session-reconstructed`(セッションの問題を再構成)/ `original`(理解確認用に作成) |
| `sourceKey` | origin が session 系のとき | 出典セッションの key |
| `missedInSession` | | セッションで間違えた問題なら `true`(初回から復習に入る) |
| `difficulty` | | 1〜3 |

### つまずきタグ

| タグ | 意味 |
|---|---|
| `reading` | 問題文・用語の読解 |
| `symbol` | 記号・図の読み方 |
| `prerequisite` | 前提知識の不足 |
| `why` | 「なぜ」の理解 |
| `confusion` | 似た概念の混同 |
| `trap` | ひっかけ |
| `calc` | 計算・式の立て方 |
| `trace` | 手順のトレース |

## 比較カード

```jsonc
{ "id": "cmp-...", "title": "A vs B", "topicIds": ["..."], "oneLiner": "違いの一言",
  "headers": ["", "A", "B"], "rows": [["観点", "Aの場合", "Bの場合"]] }
```

## 記号

```jsonc
{ "id": "sym-...", "symbol": "x ← 式", "name": "代入", "meaning": "説明", "topicIds": ["..."] }
```

## ガイド

```jsonc
{ "id": "guide-...", "title": "タイトル", "body": ["Markdown のブロック", "..."] }
```

## 統合ルール

ファイル名順に適用します(実装は `tools/content-lib.mjs`)。

- トピック:同じ `id` があれば、配列フィールドは追記(問題は id、用語は term で重複を除外)、スカラーフィールドは後のパックで値があれば上書き
- 比較カード・記号・ガイド:同じ `id` は後のパックで丸ごと上書き
- セッション(`sources`):`key` で統合

## 検査

```
node tools/validate.mjs           # 検査
node tools/validate.mjs --index   # 検査して content/topic-index.md を更新
```
