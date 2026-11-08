import { Link } from "react-router-dom";
import { content, sessionAddedAt, topicById } from "../content/load";
import { buildToc, dialoguesOfSession, recentSessions } from "../content/structure";
import { useReading } from "../reading/storage";

const toc = buildToc(content.topics);
const recent = recentSessions(content.sessions, sessionAddedAt);

const formatDate = (d?: string) => (d ? d.replace(/-/g, "/") : "");

/** ホーム:目次が主役。上に「続きから読む」「最近追加されたセッション」 */
export function HomePage() {
  const { state } = useReading();
  const last = state.lastTopicId ? topicById.get(state.lastTopicId) : undefined;
  const readCount = content.topics.filter((t) => state.read[t.id]).length;

  return (
    <div className="page">
      {last && (
        <section className="home-section">
          <h2>続きから読む</h2>
          <Link to={`/topic/${last.id}`} className="card continue-card">
            <span className="muted">{last.category}</span>
            <strong>{last.title}</strong>
          </Link>
        </section>
      )}

      {recent.length > 0 && (
        <section className="home-section">
          <h2>最近追加されたセッション</h2>
          <ul className="link-list">
            {recent.map((s) => (
              <li key={s.key}>
                <Link to={`/sessions/${encodeURIComponent(s.key)}`}>
                  <span>{s.title}</span>
                  <span className="muted">
                    {formatDate(s.date)}・やりとり {dialoguesOfSession(content.topics, s.key).length}件
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/sessions" className="more-link">
            すべてのセッションを見る
          </Link>
        </section>
      )}

      <section className="home-section">
        <h2>目次</h2>
        <p className="muted">
          既読 {readCount} / {content.topics.length} トピック
        </p>
        {toc.map(({ field, categories }) => (
          <section key={field} className="field-group">
            <h3>{field}</h3>
            {categories.map((g) => {
              const read = g.topics.filter((t) => state.read[t.id]).length;
              return (
                <details key={g.category} className="category">
                  <summary>
                    <span>{g.category}</span>
                    <span className="count">
                      {read}/{g.topics.length}
                    </span>
                  </summary>
                  <ul className="toc-list">
                    {g.topics.map((t) => (
                      <li key={t.id}>
                        <Link to={`/topic/${t.id}`}>
                          <span className={`read-mark ${state.read[t.id] ? "on" : ""}`} aria-label={state.read[t.id] ? "既読" : "未読"}>
                            {state.read[t.id] ? "✓" : ""}
                          </span>
                          <span className="toc-title">{t.title}</span>
                          {state.bookmarks.includes(t.id) && (
                            <span className="bookmark-mark" aria-label="しおり">
                              ★
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              );
            })}
          </section>
        ))}
      </section>

      <p className="muted home-footer">
        問題演習は、下の「演習」タブから。
      </p>
    </div>
  );
}
