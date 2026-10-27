# 計画:段階1〜2+公開の仕組み(2026-10-28 承認)

種類:新規作成
範囲:SPEC 7章の段階1(土台)+段階2(演習画面)+段階6の GitHub Pages 自動デプロイ(前倒し)。PWA は段階6で行う。

## 1. 要件

1. `content/packs/*.json` をファイル名順に読み込み、`tools/content-lib.mjs` の `mergePacks` と同じ結果で統合する(Vitest で保証)
2. 教材にエラーがあると `npm run build` が止まる(`prebuild` で `node tools/validate.mjs`)
3. 演習画面:1問1画面、choice / numeric(数字キーボード、tolerance 以内で正解)、確信度(自信あり/たぶん)、「問題文を言い換える」(readingAid があるとき)
4. 回答後:記号つき正誤 → 選んだ誤答の wrongReasons を大きく → 解説 → 不正解なら前提トピックへのリンク → 「トピックを読む」「次の問題」
5. 出題モード:ランダム10問/大分類別/トピック別。最後に正解数を表示
6. 幅 360px で崩れない。主なボタンは画面下部。ダークモードは端末設定に従う
7. GitHub へ push すると GitHub Actions でビルド・公開される

作らないもの:学習記録の保存・復習(段階3)、本格的なトピック画面・マップ(段階4)。前提トピックのリンク先は仮のトピック画面(タイトル・要約・要点)。

## 2. 技術

Vite / React + TypeScript / react-router(HashRouter) / react-markdown + remark-gfm / Vitest / GitHub Actions + Pages

## 3. 影響範囲

- `content/packs/`、`tools/`、`content/SCHEMA.md` は変更しない
- リポジトリ全体が公開される

## 4. 実装計画

0. 準備:git init、`.gitignore`、`docs/patterns.md`、`docs/work/`、この plan.md
1. `package.json`(prebuild に検査)、`vite.config.ts`(base: `/it-study/`)、`index.html`(noindex)、`tsconfig`
2. `src/content/types.ts`、`merge.ts`、`load.ts`、`merge.test.ts`
3. `src/pages/*`、`src/components/*`、`src/styles.css`
4. `.github/workflows/deploy.yml`
5. 公開リポジトリ `sugiyoshi-neo/it-study` を作成して push、Pages(GitHub Actions)を有効化
6. reviewer で検証 → 完了報告

## 5. 確認方法

- `npm test`:実際の6パック+人工データで `content-lib.mjs` と一致
- 一時的に壊れたパックを置くと `npm run build` が止まる(確認後すぐ削除)
- 公開 URL をスマホで開き、ランダム10問 → 回答 → 解説 → 次の問題
- `q-trans-1` で「エ」を選ぶと wrongReasons が出る
- `q-xor-2`(トピック「XOR・NAND・NOR・XNOR と相補演算」の2問目)で「イ」を選ぶと、wrongReasons と前提トピック「真理値表と基本の論理演算」へのリンクが出る
  (検証時の修正:当初 q-trans-1 で前提トピックを確認する予定だったが、そのトピックには前提トピックが設定されていないため差し替え)
- push 後に Actions が成功し、`https://sugiyoshi-neo.github.io/it-study/` が開ける

## 仮定

- リポジトリ名 `it-study`(公開)。承認により作成と push を許可済み
- 学習結果は保存しない(段階3で追加)
