# パターン集（過去の修正と学び）

作業のたびに Claude が追記し、次回以降の判断材料にするファイル。
調査の最初に必ず読む。

## 書き方

1つの学びにつき、以下の形で1項目を書く。
同じ種類の学びがすでにある場合は、新しく足さずに既存の項目を更新する。

```
### 見出し（何についての学びか一言で）
- 日付：YYYY-MM-DD
- 種類：バグ修正 / 新規作成
- 症状・状況：何が起きたか、何を作ったか
- 原因・判断：なぜ起きたか、なぜその作り方にしたか
- 対処：どう直したか、どう作ったか
- 次回の注意：次に似た作業をするときに気をつけること
- 関連ファイル：
```

---

（ここから下に追記していく）

### GitHub Actions の設定ファイルを push するには workflow 権限が要る
- 日付：2026-10-28
- 種類：新規作成
- 症状・状況：`.github/workflows/deploy.yml` を含む push が「`workflow` scope がない」と拒否された
- 原因・判断：gh のログイン権限が `gist, read:org, repo` だけで、workflow ファイルの作成・更新に必要な `workflow` がなかった
- 対処：利用者に `gh auth refresh -h github.com -s workflow` を実行してもらった。このコマンドは「Press Enter to open...」で Enter を押すまで待ち続け、ブラウザで承認しても Enter を押さないと完了しない。利用者はここで止まった
- 次回の注意：workflow ファイルを初めて push する前に `gh auth status` で `workflow` があるか確かめる。なければ、承認レポートの段階で手順を案内する。「先に Enter → ブラウザで承認 → ターミナルに Authentication complete」の順で説明する
- 関連ファイル：.github/workflows/deploy.yml

### HashRouter の location.key は、アプリ外からの移動だと "default" で重なる
- 日付：2026-10-28
- 種類：新規作成
- 症状・状況：URL の # 以降を直接変えて別の演習を開くと、前の演習が表示されたままになった
- 原因・判断：演習の途中状態を location.key ごとに覚えていたが、アプリ外からの移動ではどの履歴も key が "default" になる
- 対処：`${location.key}|${location.search}` を識別子にした
- 次回の注意：画面の状態を location.key で覚えるときは、パスや検索条件も含める
- 関連ファイル：src/pages/PracticePage.tsx

### 計画の確認方法に使う例は、教材データで条件を満たすか先に確かめる
- 日付：2026-10-28
- 種類：新規作成
- 症状・状況：確認方法に「q-trans-1 で前提トピックが出る」と書いたが、そのトピックの prerequisites が空で、検証役が NG にした
- 原因・判断：問題 id を、中身を確かめずに例に選んだ
- 対処：条件を満たす問題（q-xor-2 で「イ」）に差し替えた
- 次回の注意：確認方法で問題 id を挙げるときは、content-lib.mjs で統合したデータを検索し、条件（wrongReasons・prerequisites・readingAid など）を満たすかを確かめてから書く
- 関連ファイル：docs/work/2026-10-28_stage1-2/plan.md

### スマホ幅の画面確認は、Chrome のヘッドレス操作で行える
- 日付：2026-10-28
- 種類：新規作成
- 症状・状況：幅 360px での見た目と、タップ操作（選択 → 回答 → 戻る）を確認したかった
- 原因・判断：新しいライブラリを入れずに確認したかった
- 対処：Node から Chrome を `--headless=new --remote-debugging-port` で起動し、DevTools Protocol（Emulation.setDeviceMetricsOverride で 360px、Runtime.evaluate でクリック、Page.captureScreenshot）で操作した。`document.documentElement.scrollWidth > 360` で横のはみ出しを判定した。スクリプトはスクラッチパッドに置いた
- 次回の注意：`--user-data-dir` は Windows の絶対パスで渡す（相対パスだと Chrome が起動しない）。React の input に値を入れるときは、ネイティブの value setter を呼んでから input イベントを発火する
- 関連ファイル：なし（スクラッチパッドの shots.mjs）
