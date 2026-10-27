import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Markdown } from "../components/Markdown";
import { allQuestions, topicById, type QuestionEntry } from "../content/load";
import type { Question } from "../content/types";
import { isCorrect, isPracticeMode, parseNumber, pickQuestions } from "../practice/logic";

type AnswerRecord = { answer: string; correct: boolean; confident: boolean };

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
        <Link to="/">出題の選び方に戻る</Link>
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

  return (
    <QuestionView
      key={state.index}
      entry={entries[state.index]}
      position={state.index + 1}
      total={entries.length}
      record={state.answers[state.index]}
      onAnswer={(record) =>
        setState((s) => {
          const answers = [...s.answers];
          answers[s.index] = record;
          return { ...s, answers };
        })
      }
      onNext={() => {
        window.scrollTo(0, 0);
        setState((s) => ({ ...s, index: s.index + 1 }));
      }}
    />
  );
}

function QuestionView({
  entry,
  position,
  total,
  record,
  onAnswer,
  onNext,
}: {
  entry: QuestionEntry;
  position: number;
  total: number;
  record: AnswerRecord | undefined;
  onAnswer: (r: AnswerRecord) => void;
  onNext: () => void;
}) {
  const { question, topic } = entry;
  const [selected, setSelected] = useState<string | null>(null);
  const [numericInput, setNumericInput] = useState("");
  const [showAid, setShowAid] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const answeredNow = useRef(false);

  useEffect(() => {
    // 回答した直後だけ、結果の位置までスクロールする(戻ってきたときは動かさない)
    if (record && answeredNow.current) {
      feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [record]);

  const current = record ? record.answer : question.type === "choice" ? selected : numericInput;
  const numericInvalid = question.type === "numeric" && numericInput.trim() !== "" && parseNumber(numericInput) === null;
  const canAnswer = !record && current !== null && current.trim() !== "" && !numericInvalid;

  const submit = (confident: boolean) => {
    if (!canAnswer || current === null) return;
    answeredNow.current = true;
    onAnswer({ answer: current, correct: isCorrect(question, current), confident });
  };

  return (
    <div className="page practice">
      <p className="progress">
        <span>
          {position} / {total}
        </span>
        <span className="muted">{topic.title}</span>
      </p>

      <p className="prompt">{question.prompt}</p>

      {question.readingAid && (
        <>
          <button type="button" className="link-button" aria-expanded={showAid} onClick={() => setShowAid((v) => !v)}>
            {showAid ? "言い換えを閉じる" : "問題文を言い換える"}
          </button>
          {showAid && (
            <div className="card aid">
              <Markdown>{question.readingAid}</Markdown>
            </div>
          )}
        </>
      )}

      {question.type === "choice" ? (
        <ul className="choices">
          {question.choices.map((c) => {
            const isChosen = current === c.id;
            const isAnswer = c.id === question.answer;
            let cls = "choice";
            let mark = "";
            if (record) {
              if (isAnswer) {
                cls += " correct";
                mark = "○ 正解";
              } else if (isChosen) {
                cls += " wrong";
                mark = "✕ あなたの回答";
              }
            } else if (isChosen) {
              cls += " selected";
            }
            return (
              <li key={c.id}>
                <button
                  type="button"
                  className={cls}
                  aria-pressed={isChosen}
                  disabled={!!record}
                  onClick={() => setSelected(c.id)}
                >
                  <span className="choice-id">{c.id}</span>
                  <span className="choice-text">{c.text}</span>
                  {mark && <span className="choice-mark">{mark}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <form
          className="numeric"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <label>
            <span>答え</span>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={record ? record.answer : numericInput}
              disabled={!!record}
              onChange={(e) => setNumericInput(e.target.value)}
              aria-invalid={numericInvalid}
            />
            {question.unit && <span>{question.unit}</span>}
          </label>
          {numericInvalid && <p className="error">数字で入力してください</p>}
        </form>
      )}

      {record && (
        <div ref={feedbackRef} className="feedback">
          <Feedback question={question} record={record} prerequisites={topic.prerequisites} />
        </div>
      )}

      <div className="action-bar">
        {!record ? (
          <>
            <p className="action-hint">{canAnswer ? "自信の度合いを選んで回答" : "答えを選んでください"}</p>
            <div className="button-row">
              <button type="button" className="button" disabled={!canAnswer} onClick={() => submit(false)}>
                たぶん
              </button>
              <button type="button" className="button primary" disabled={!canAnswer} onClick={() => submit(true)}>
                自信あり
              </button>
            </div>
          </>
        ) : (
          <div className="button-row">
            <Link to={`/topic/${topic.id}`} className="button">
              トピックを読む
            </Link>
            <button type="button" className="button primary" onClick={onNext}>
              {position < total ? "次の問題" : "結果を見る"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function answerText(question: Question): string {
  if (question.type === "choice") {
    const c = question.choices.find((x) => x.id === question.answer);
    return c ? `${c.id}:${c.text}` : question.answer;
  }
  return `${question.answer}${question.unit ? ` ${question.unit}` : ""}`;
}

function Feedback({
  question,
  record,
  prerequisites,
}: {
  question: Question;
  record: AnswerRecord;
  prerequisites: string[];
}) {
  const wrongReason =
    !record.correct && question.type === "choice" ? question.wrongReasons?.[record.answer] : undefined;
  const prereqTopics = prerequisites.map((p) => topicById.get(p)).filter((t) => t !== undefined);

  return (
    <>
      <section className={`verdict ${record.correct ? "ok" : "ng"}`} aria-live="polite">
        <p className="verdict-title">{record.correct ? "○ 正解" : "✕ 不正解"}</p>
        {!record.correct && <p>正解は {answerText(question)}</p>}
        <p className="muted">{record.confident ? "「自信あり」で回答" : "「たぶん」で回答"}</p>
      </section>

      {wrongReason && (
        <section className="card wrong-reason">
          <h2>この選択肢を選んだなら、こう考えたのでは?</h2>
          <Markdown>{wrongReason}</Markdown>
        </section>
      )}

      <section className="card">
        <h2>解説</h2>
        <Markdown>{question.explanation}</Markdown>
      </section>

      {!record.correct && prereqTopics.length > 0 && (
        <section className="card prereq">
          <h2>ここに戻ると解きやすくなります</h2>
          <ul>
            {prereqTopics.map((t) => (
              <li key={t.id}>
                <Link to={`/topic/${t.id}`}>{t.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
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
          <Link to="/" className="button">
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
