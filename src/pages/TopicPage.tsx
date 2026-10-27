import { Link, useParams } from "react-router-dom";
import { topicById } from "../content/load";

/** 仮のトピック画面(タイトル・たとえ・要約・要点)。本格版は段階4で作る */
export function TopicPage() {
  const { id } = useParams();
  const topic = id ? topicById.get(id) : undefined;

  if (!topic) {
    return (
      <div className="page">
        <p>トピックが見つかりません。</p>
        <Link to="/">はじめに戻る</Link>
      </div>
    );
  }

  const prereqs = topic.prerequisites.map((p) => topicById.get(p)).filter((t) => t !== undefined);

  return (
    <div className="page">
      <p className="muted">
        {topic.field} / {topic.category}
      </p>
      <h1>{topic.title}</h1>

      {topic.analogy && (
        <section className="card analogy">
          <h2>たとえ</h2>
          <p>{topic.analogy}</p>
        </section>
      )}

      <section className="card">
        <h2>要約</h2>
        <p>{topic.summary}</p>
      </section>

      {topic.keyPoints.length > 0 && (
        <section className="card">
          <h2>要点</h2>
          <ul>
            {topic.keyPoints.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </section>
      )}

      {prereqs.length > 0 && (
        <section className="card">
          <h2>前提トピック</h2>
          <ul>
            {prereqs.map((t) => (
              <li key={t.id}>
                <Link to={`/topic/${t.id}`}>{t.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="notice">この画面は簡易版です。図・解説・つまずきなどは次の段階で追加します。</p>

      {topic.questions.length > 0 && (
        <div className="action-bar">
          <Link to={`/practice?mode=topic&key=${encodeURIComponent(topic.id)}`} className="button primary">
            このトピックの問題を解く({topic.questions.length}問)
          </Link>
        </div>
      )}
    </div>
  );
}
