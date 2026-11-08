import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { topicById } from "../content/load";
import type { Question } from "../content/types";
import { isCorrect, parseNumber } from "../practice/logic";
import { Markdown } from "./Markdown";

export type AnswerRecord = { answer: string; correct: boolean; confident: boolean };

/**
 * 1問ぶんの出題・回答・結果表示。演習画面とトピック画面の確認問題で共通に使う。
 * - sticky:回答ボタンを画面下部に固定する(演習画面)。false ならその場に置く(確認問題)
 * - footer:回答後に出すボタン(演習画面の「次の問題」など)
 */
export function QuestionCard({
  question,
  prerequisites,
  record,
  onAnswer,
  sticky,
  footer,
}: {
  question: Question;
  prerequisites: string[];
  record: AnswerRecord | undefined;
  onAnswer: (r: AnswerRecord) => void;
  sticky: boolean;
  footer?: ReactNode;
}) {
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

  const answerButtons = (
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
  );

  return (
    <div className="question">
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
          <Feedback question={question} record={record} prerequisites={prerequisites} />
        </div>
      )}

      {sticky ? (
        <div className="action-bar">{record ? footer : answerButtons}</div>
      ) : (
        !record && <div className="inline-actions">{answerButtons}</div>
      )}
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
          <h4>この選択肢を選んだなら、こう考えたのでは?</h4>
          <Markdown>{wrongReason}</Markdown>
        </section>
      )}

      <section className="card">
        <h4>解説</h4>
        <Markdown>{question.explanation}</Markdown>
      </section>

      {!record.correct && prereqTopics.length > 0 && (
        <section className="card prereq">
          <h4>ここに戻ると解きやすくなります</h4>
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
