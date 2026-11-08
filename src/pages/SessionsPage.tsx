import { Link, useParams } from "react-router-dom";
import { DialogueView } from "../components/DialogueView";
import { content, sessionByKey } from "../content/load";
import { dialoguesOfSession, sortSessions, topicsOfSession } from "../content/structure";

const formatDate = (d?: string) => (d ? d.replace(/-/g, "/") : "");

/** セッション一覧(日付の新しい順) */
export function SessionsPage() {
  return (
    <div className="page">
      <h1>セッション</h1>
      <p className="muted">チャットごとに、そのときのやりとりを読み返せます。</p>
      <ul className="link-list sessions-list">
        {sortSessions(content.sessions).map((s) => (
          <li key={s.key}>
            <Link to={`/sessions/${encodeURIComponent(s.key)}`}>
              <span>{s.title}</span>
              <span className="muted">
                {formatDate(s.date)}・トピック {topicsOfSession(content.topics, s.key).length}・やりとり{" "}
                {dialoguesOfSession(content.topics, s.key).length}件
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 1つのセッション:元のチャットへのリンク、トピック、やりとり(日付順) */
export function SessionPage() {
  const { key } = useParams();
  const session = key ? sessionByKey.get(key) : undefined;
  if (!session) {
    return (
      <div className="page">
        <p>セッションが見つかりません。</p>
        <Link to="/sessions">セッション一覧に戻る</Link>
      </div>
    );
  }
  const topics = topicsOfSession(content.topics, session.key);
  const dialogues = dialoguesOfSession(content.topics, session.key);

  return (
    <div className="page reading">
      <p className="breadcrumb muted">
        <Link to="/sessions">セッション</Link> › {formatDate(session.date)}
      </p>
      <h1>{session.title}</h1>
      {session.url && (
        <a href={session.url} target="_blank" rel="noopener noreferrer" className="button block">
          元のチャットを開く(claude.ai)↗
        </a>
      )}

      {topics.length > 0 && (
        // やりとりを主役にするため、トピック一覧は折りたたんでおく
        <details className="card session-topics">
          <summary>このセッションのトピック({topics.length})</summary>
          <ul className="link-list">
            {topics.map((t) => (
              <li key={t.id}>
                <Link to={`/topic/${t.id}`}>
                  <span>{t.title}</span>
                  <span className="muted">{t.category}</span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}

      <section className="topic-section">
        <h2>やりとり({dialogues.length}件)</h2>
        {dialogues.length === 0 && <p className="muted">このセッションのやりとりは、まだ教材に入っていません。</p>}
        {dialogues.map(({ topic, dialogue }) => (
          <DialogueView key={`${topic.id}|${dialogue.title}`} dialogue={dialogue} topic={topic} showSession={false} />
        ))}
      </section>
    </div>
  );
}
