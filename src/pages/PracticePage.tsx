import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { QuestionCard, type AnswerRecord } from "../components/QuestionCard";
import { allQuestions, type QuestionEntry } from "../content/load";
import { isPracticeMode, pickQuestions } from "../practice/logic";

type SessionState = { questionIds: string[]; index: number; answers: (AnswerRecord | undefined)[] };

// 「トピックを読む」から戻ったときに続きから再開できるよう、履歴の位置ごとに覚えておく
const sessionCache = new Map<string, SessionState>();

const entryById = new Map(allQuestions.map((e) => [e.question.id, e]));

export function PracticePage() {
  const location = useLocation();
  // アプリ外からの移動(URL の直接入力など)では location.key が "default" で重なるため、出題条件も含める
  const cacheKey = `${location.key}|${location.search}`;
  return <PracticeSession key={cacheKey} cacheKey={cacheKey} />;
}

function PracticeSession({ cacheKey }: { cacheKey: string }) {
  const [params] = useSearchParams();
  const mode = params.get("mode");
  const key = params.get("key");

  const newSession = (): SessionState => ({
    questionIds: isPracticeMode(mode) ? pickQuestions(allQuestions, mode, key).map((e) => e.question.id) : [],
    index: 0,
    answers: [],
  });

  const [state, setState] = useState<SessionState>(() => sessionCache.get(cacheKey) ?? newSession());

  useEffect(() => {
    sessionCache.set(cacheKey, state);
  }, [cacheKey, state]);

  const entries = state.questionIds.map((id) => entryById.get(id)).filter((e) => e !== undefined);

  if (entries.length === 0) {
    return (
      <div className="page">
        <p>出題できる問題が見つかりませんでした。</p>
        <Link to="/drill">出題の選び方に戻る</Link>
      </div>
    );
  }

  if (state.index >= entries.length) {
    return (
      <ResultView
        entries={entries}
        answers={state.answers}
        onRetry={() => {
          window.scrollTo(0, 0);
          setState(newSession());
        }}
      />
    );
  }

  const { question, topic } = entries[state.index];
  const position = state.index + 1;

  return (
    <div className="page practice">
      <p className="progress">
        <span>
          {position} / {entries.length}
        </span>
        <span className="muted">{topic.title}</span>
      </p>
      <QuestionCard
        key={state.index}
        question={question}
        prerequisites={topic.prerequisites}
        record={state.answers[state.index]}
        onAnswer={(record) =>
          setState((s) => {
            const answers = [...s.answers];
            answers[s.index] = record;
            return { ...s, answers };
          })
        }
        sticky
        footer={
          <div className="button-row">
            <Link to={`/topic/${topic.id}`} className="button">
              トピックを読む
            </Link>
            <button
              type="button"
              className="button primary"
              onClick={() => {
                window.scrollTo(0, 0);
                setState((s) => ({ ...s, index: s.index + 1 }));
              }}
            >
              {position < entries.length ? "次の問題" : "結果を見る"}
            </button>
          </div>
        }
      />
    </div>
  );
}

function ResultView({
  entries,
  answers,
  onRetry,
}: {
  entries: QuestionEntry[];
  answers: (AnswerRecord | undefined)[];
  onRetry: () => void;
}) {
  const correctCount = answers.filter((a) => a?.correct).length;
  return (
    <div className="page">
      <h1>結果</h1>
      <p className="score">
        {entries.length}問中 <strong>{correctCount}問</strong> 正解
      </p>
      <ul className="result-list">
        {entries.map((e, i) => {
          const a = answers[i];
          return (
            <li key={e.question.id} className={a?.correct ? "ok" : "ng"}>
              <span className="result-mark">{a?.correct ? "○" : "✕"}</span>
              <span className="result-body">
                <span className="result-prompt">{e.question.prompt}</span>
                <Link to={`/topic/${e.topic.id}`}>{e.topic.title}</Link>
              </span>
            </li>
          );
        })}
      </ul>
      <div className="action-bar">
        <div className="button-row">
          <Link to="/drill" className="button">
            選び方に戻る
          </Link>
          <button type="button" className="button primary" onClick={onRetry}>
            同じ条件でもう一度
          </button>
        </div>
      </div>
    </div>
  );
}
