import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { DialogueView } from "../components/DialogueView";
import { Markdown } from "../components/Markdown";
import { Mermaid } from "../components/Mermaid";
import { QuestionCard, type AnswerRecord } from "../components/QuestionCard";
import { content, sessionByKey, topicById } from "../content/load";
import type { SectionId } from "../content/search";
import type { MergedTopic, Question } from "../content/types";
import { useReading } from "../reading/storage";

type Section = { id: SectionId; title: string; children?: { id: string; title: string }[]; body: ReactNode };

const sectionDomId = (id: string) => `sec-${id}`;

function scrollToId(domId: string) {
  document.getElementById(domId)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** トピック画面(読み物)。表示順は docs/SPEC.md 4.3 */
export function TopicPage() {
  const { id } = useParams();
  const topic = id ? topicById.get(id) : undefined;
  if (!topic) {
    return (
      <div className="page">
        <p>トピックが見つかりません。</p>
        <Link to="/">目次に戻る</Link>
      </div>
    );
  }
  return <TopicArticle key={topic.id} topic={topic} />;
}

function TopicArticle({ topic }: { topic: MergedTopic }) {
  const [params] = useSearchParams();
  const target = params.get("section");
  const { state, toggleBookmark, setRead, setLastTopic } = useReading();
  const [questionsOpen, setQuestionsOpen] = useState(target === "questions");

  useEffect(() => {
    setLastTopic(topic.id);
  }, [setLastTopic, topic.id]);

  // 検索結果などから来たときは、そのセクションへ移動する
  useEffect(() => {
    if (!target) return;
    if (target === "questions") setQuestionsOpen(true);
    const t = setTimeout(() => scrollToId(sectionDomId(target)), 50);
    return () => clearTimeout(t);
  }, [target]);

  const bookmarked = state.bookmarks.includes(topic.id);
  const readAt = state.read[topic.id];
  const sections = buildSections(topic, questionsOpen, setQuestionsOpen);
  const sessions = topic.sources.map((k) => sessionByKey.get(k)).filter((s) => s !== undefined);

  return (
    <div className="page reading">
      <p className="breadcrumb muted">
        {topic.field} › {topic.category}
      </p>
      <div className="topic-head">
        <h1>{topic.title}</h1>
        <button
          type="button"
          className={`bookmark-button ${bookmarked ? "on" : ""}`}
          aria-pressed={bookmarked}
          aria-label={bookmarked ? "しおりを外す" : "しおりを付ける"}
          onClick={() => toggleBookmark(topic.id)}
        >
          {bookmarked ? "★" : "☆"}
          <span>しおり</span>
        </button>
      </div>
      {sessions.length > 0 && (
        <p className="source-chips">
          {sessions.map((s) => (
            <Link key={s.key} to={`/sessions/${encodeURIComponent(s.key)}`} className="chip">
              {s.title}
            </Link>
          ))}
        </p>
      )}

      <details className="page-toc" open>
        <summary>このページの目次</summary>
        <ol>
          {sections.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => scrollToId(sectionDomId(s.id))}>
                {s.title}
              </button>
              {s.children && (
                <ul>
                  {s.children.map((c) => (
                    <li key={c.id}>
                      <button type="button" onClick={() => scrollToId(c.id)}>
                        {c.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </details>

      {sections.map((s) => (
        <section key={s.id} id={sectionDomId(s.id)} className={`topic-section section-${s.id}`}>
          <h2>{s.title}</h2>
          {s.body}
        </section>
      ))}

      <div className="read-footer">
        {readAt ? (
          <>
            <p className="muted">✓ {readAt.replace(/-/g, "/")} に読み終えました</p>
            <button type="button" className="button" onClick={() => setRead(topic.id, false)}>
              未読に戻す
            </button>
          </>
        ) : (
          <button type="button" className="button primary block" onClick={() => setRead(topic.id, true)}>
            読み終えた ✓
          </button>
        )}
        <Link to="/" className="more-link">
          目次に戻る
        </Link>
      </div>
    </div>
  );
}

function buildSections(topic: MergedTopic, questionsOpen: boolean, setQuestionsOpen: (v: boolean) => void): Section[] {
  const out: Section[] = [];

  if (topic.analogy) {
    out.push({ id: "analogy", title: "たとえ", body: <div className="card analogy">{topic.analogy}</div> });
  }

  out.push({
    id: "summary",
    title: "要約",
    body: (
      <>
        <p className="summary">{topic.summary}</p>
        {topic.keyPoints.length > 0 && (
          <div className="card">
            <h3>要点</h3>
            <ul>
              {topic.keyPoints.map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>
          </div>
        )}
      </>
    ),
  });

  if (topic.diagram?.type === "mermaid") {
    out.push({ id: "diagram", title: "図", body: <Mermaid code={topic.diagram.code} /> });
  }

  if (topic.explanation.length > 0 || topic.formulas.length > 0) {
    out.push({
      id: "explanation",
      title: "解説",
      body: (
        <>
          {topic.explanation.map((block, i) => (
            <Markdown key={i}>{block}</Markdown>
          ))}
          {topic.formulas.length > 0 && (
            <div className="card">
              <h3>公式</h3>
              <dl className="formulas">
                {topic.formulas.map((f) => (
                  <div key={f.name}>
                    <dt>{f.name}</dt>
                    <dd>
                      <code>{f.expr}</code>
                      {f.note && <p className="muted">{f.note}</p>}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </>
      ),
    });
  }

  if (topic.dialogues.length > 0) {
    out.push({
      id: "dialogues",
      title: "チャットでのやりとり",
      children: topic.dialogues.map((d, i) => ({ id: `dlg-${i}`, title: d.title })),
      body: topic.dialogues.map((d, i) => <DialogueView key={`${d.sourceKey}|${d.title}`} dialogue={d} id={`dlg-${i}`} />),
    });
  }

  if (topic.pitfalls.length > 0) {
    out.push({
      id: "pitfalls",
      title: "あなたのつまずき",
      body: (
        <div className="card pitfalls">
          <p className="pitfalls-lead">前回ここで止まりました</p>
          <ul>
            {topic.pitfalls.map((p) => (
              <li key={p.text}>{p.text}</li>
            ))}
          </ul>
        </div>
      ),
    });
  }

  if (topic.terms.length > 0) {
    out.push({
      id: "terms",
      title: "用語",
      body: (
        <dl className="terms">
          {topic.terms.map((t) => (
            <div key={t.term}>
              <dt>{t.term}</dt>
              <dd>{t.definition}</dd>
            </div>
          ))}
        </dl>
      ),
    });
  }

  const prereqs = topic.prerequisites.map((p) => topicById.get(p)).filter((t) => t !== undefined);
  const related = topic.related.map((p) => topicById.get(p)).filter((t) => t !== undefined);
  const comparisons = content.comparisons.filter((c) => c.topicIds?.includes(topic.id));
  if (prereqs.length + related.length + comparisons.length > 0) {
    out.push({
      id: "related",
      title: "関連トピック",
      body: (
        <>
          {prereqs.length > 0 && <TopicLinks title="先に読むと分かりやすいトピック(前提)" topics={prereqs} />}
          {related.length > 0 && <TopicLinks title="関連するトピック" topics={related} />}
          {comparisons.length > 0 && (
            <>
              <h3>似た概念との比較</h3>
              {comparisons.map((c) => (
                <details key={c.id} className="card comparison">
                  <summary>{c.title}</summary>
                  <p className="comparison-one-liner">{c.oneLiner}</p>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          {c.headers.map((h, i) => (
                            <th key={i}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {c.rows.map((r, i) => (
                          <tr key={i}>
                            {r.map((cell, j) => (j === 0 ? <th key={j}>{cell}</th> : <td key={j}>{cell}</td>))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              ))}
            </>
          )}
        </>
      ),
    });
  }

  if (topic.questions.length > 0) {
    out.push({
      id: "questions",
      title: "確認問題",
      body: (
        <details
          className="questions-box"
          open={questionsOpen}
          onToggle={(e) => setQuestionsOpen((e.currentTarget as HTMLDetailsElement).open)}
        >
          <summary>読み終えたら解いてみる({topic.questions.length}問)</summary>
          {topic.questions.map((q, i) => (
            <InlineQuestion key={q.id} number={i + 1} question={q} prerequisites={topic.prerequisites} />
          ))}
        </details>
      ),
    });
  }

  return out;
}

function TopicLinks({ title, topics }: { title: string; topics: MergedTopic[] }) {
  return (
    <>
      <h3>{title}</h3>
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
    </>
  );
}

function InlineQuestion({ number, question, prerequisites }: { number: number; question: Question; prerequisites: string[] }) {
  const [record, setRecord] = useState<AnswerRecord | undefined>();
  return (
    <div className="inline-question">
      <h3>問{number}</h3>
      <QuestionCard question={question} prerequisites={prerequisites} record={record} onAnswer={setRecord} sticky={false} />
    </div>
  );
}
