import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getSearchIndex } from "../content/load";
import { search } from "../content/search";

/** 全文検索。検索語は URL に入れて、トピックから戻ったときに結果が残るようにする */
export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const results = useMemo(() => search(getSearchIndex(), q), [q]);

  return (
    <div className="page">
      <h1>検索</h1>
      <form role="search" onSubmit={(e) => e.preventDefault()}>
        <input
          type="search"
          className="search-input"
          placeholder="トピック名・解説・やりとり・用語"
          aria-label="検索する言葉"
          value={q}
          autoFocus={!q}
          enterKeyHint="search"
          onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
        />
      </form>

      {q.trim() !== "" && (
        <p className="muted">{results.length > 0 ? `${results.length} 件のトピック` : "見つかりませんでした"}</p>
      )}

      <ul className="search-results">
        {results.map(({ topic, hits }) => (
          <li key={topic.id}>
            <Link to={`/topic/${topic.id}`} className="search-topic">
              {topic.title}
            </Link>
            <span className="muted">{topic.category}</span>
            {hits.map((h, i) => (
              <Link key={i} to={`/topic/${topic.id}?section=${h.section}`} className="search-hit">
                <span className="search-hit-label">{h.label}</span>
                <span className="search-snippet">
                  {h.snippet.before}
                  <mark>{h.snippet.match}</mark>
                  {h.snippet.after}
                </span>
              </Link>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}
