import { Link } from "react-router-dom";
import { topicById } from "../content/load";
import { useReading } from "../reading/storage";

/** しおりを付けたトピックの一覧(付けた順の新しいものが上) */
export function BookmarksPage() {
  const { state } = useReading();
  const topics = [...state.bookmarks]
    .reverse()
    .map((id) => topicById.get(id))
    .filter((t) => t !== undefined);

  return (
    <div className="page">
      <h1>しおり</h1>
      {topics.length === 0 ? (
        <p className="muted">まだしおりはありません。トピック画面の「☆ しおり」を押すと、ここに並びます。</p>
      ) : (
        <ul className="link-list">
          {topics.map((t) => (
            <li key={t.id}>
              <Link to={`/topic/${t.id}`}>
                <span>
                  ★ {t.title}
                  {state.read[t.id] && <span className="read-inline"> ✓既読</span>}
                </span>
                <span className="muted">{t.category}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
