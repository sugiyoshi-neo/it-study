# IT学習アプリ(引き継ぎパッケージ)

Claude のチャットで理解した IT 知識を忘れないための、自分専用の学習アプリの「材料一式」です。アプリ本体は Claude Code で実装します。

## 中身

| ファイル | 内容 |
|---|---|
| `CLAUDE.md` | Claude Code が守るルール |
| `docs/SPEC.md` | アプリの仕様書(画面・機能・優先度・受け入れ条件) |
| `docs/analysis.md` | 8セッションのつまずき分析 |
| `docs/ADDING_CONTENT.md` | 新しいセッションを教材に追加する手順(チャットへの依頼文つき) |
| `content/packs/` | 教材データ 6パック(55トピック・108問・比較カード12・記号12) |
| `content/SCHEMA.md` | 教材データの形式 |
| `content/topic-index.md` | トピック一覧(自動生成) |
| `tools/validate.mjs` | 教材データの検査 |
| `tools/content-lib.mjs` | 教材パックの統合ロジック |

## 使い方

1. このフォルダを PC の好きな場所に展開する(例:`it-study-app`)
2. そのフォルダで Claude Code を起動する
3. 次のように頼む

```
このフォルダは IT 学習アプリの材料一式です。CLAUDE.md と docs/SPEC.md、docs/analysis.md を読んで、SPEC.md 7章の順に実装を始めてください。最初に、公開先(GitHub Pages を公開リポジトリで使うか、非公開リポジトリから Vercel などで公開するか)を私に確認してください。
```

教材の検査だけなら、Node.js があれば `node tools/validate.mjs` で実行できます。
