import { Link } from "react-router-dom";
import { allQuestions, content } from "../content/load";
import { buildToc } from "../content/structure";

const toc = buildToc(content.topics);

const practiceUrl = (mode: string, key?: string) =>
  `/practice?mode=${mode}` + (key ? `&key=${encodeURIComponent(key)}` : "");

/** 演習タブ:出題の選び方。今日の復習・弱点表示は次の段階でここに追加する */
export function DrillPage() {
  return (
    <div className="page">
      <h1>演習</h1>
      <p className="muted">問題 {allQuestions.length}問</p>
      <p className="notice">解いた結果はまだ保存されません。今日の復習・弱点表示は、次の段階でここに追加します。</p>

      <Link to={practiceUrl("random")} className="button primary block">
        ランダムに10問
      </Link>

      <h2>大分類・トピックから選ぶ</h2>
      {toc.map(({ field, categories }) => (
        <section key={field} className="field-group">
          <h3>{field}</h3>
          {categories.map((g) => {
            const count = g.topics.reduce((n, t) => n + t.questions.length, 0);
            return (
              <details key={g.category} className="category">
                <summary>
                  <span>{g.category}</span>
                  <span className="count">{count}問</span>
                </summary>
                {count > 0 && (
                  <Link to={practiceUrl("category", g.category)} className="button block">
                    この大分類から出題
                  </Link>
                )}
                <ul className="topic-list">
                  {g.topics.map((t) => (
                    <li key={t.id}>
                      <Link to={`/topic/${t.id}`}>{t.title}</Link>
                      {t.questions.length > 0 && (
                        <Link to={practiceUrl("topic", t.id)} className="small-button">
                          {t.questions.length}問を解く
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}
        </section>
      ))}
    </div>
  );
}
