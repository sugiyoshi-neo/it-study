import { Link } from "react-router-dom";
import { allQuestions, content } from "../content/load";
import { FIELDS } from "../content/merge";
import type { MergedTopic } from "../content/types";

type CategoryGroup = { category: string; topics: MergedTopic[]; questionCount: number };

/** 分野 → 大分類 → トピックにまとめる(大分類・トピックは教材に出てきた順) */
function groupTopics(topics: MergedTopic[]) {
  const byField = new Map<string, Map<string, CategoryGroup>>();
  for (const t of topics) {
    if (!byField.has(t.field)) byField.set(t.field, new Map());
    const cats = byField.get(t.field)!;
    if (!cats.has(t.category)) cats.set(t.category, { category: t.category, topics: [], questionCount: 0 });
    const g = cats.get(t.category)!;
    g.topics.push(t);
    g.questionCount += t.questions.length;
  }
  const order = (f: string) => {
    const i = (FIELDS as readonly string[]).indexOf(f);
    return i < 0 ? FIELDS.length : i;
  };
  return [...byField.entries()]
    .sort(([a], [b]) => order(a) - order(b))
    .map(([field, cats]) => ({ field, categories: [...cats.values()] }));
}

const groups = groupTopics(content.topics);

const practiceUrl = (mode: string, key?: string) =>
  `/practice?mode=${mode}` + (key ? `&key=${encodeURIComponent(key)}` : "");

export function StartPage() {
  return (
    <div className="page">
      <h1>演習</h1>
      <p className="muted">
        問題 {allQuestions.length}問 / トピック {content.topics.length}件
      </p>
      <p className="notice">試作版です。解いた結果はまだ保存されません(次の段階で保存と復習を追加します)。</p>

      <Link to={practiceUrl("random")} className="button primary block">
        ランダムに10問
      </Link>

      <h2>大分類・トピックから選ぶ</h2>
      {groups.map(({ field, categories }) => (
        <section key={field} className="field-group">
          <h3>{field}</h3>
          {categories.map((g) => (
            <details key={g.category} className="category">
              <summary>
                <span>{g.category}</span>
                <span className="count">{g.questionCount}問</span>
              </summary>
              {g.questionCount > 0 && (
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
          ))}
        </section>
      ))}
    </div>
  );
}
