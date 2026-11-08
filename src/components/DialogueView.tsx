import { Link } from "react-router-dom";
import { sessionByKey } from "../content/load";
import type { Dialogue, MergedTopic } from "../content/types";
import { Markdown } from "./Markdown";

/**
 * チャットでのやりとりをチャット風に表示する。
 * 質問(user)は短いことが多いので右寄せの吹き出しに、解説(assistant)は全幅で主役にする
 */
export function DialogueView({
  dialogue,
  id,
  showSession = true,
  topic,
}: {
  dialogue: Dialogue;
  id?: string;
  showSession?: boolean;
  topic?: MergedTopic; // セッション画面で、どのトピックのやりとりかを示すときに渡す
}) {
  const session = sessionByKey.get(dialogue.sourceKey);
  return (
    <article className="dialogue" id={id}>
      <h3 className="dialogue-title">{dialogue.title}</h3>
      <p className="dialogue-meta muted">
        {dialogue.date && <span>{dialogue.date.replace(/-/g, "/")}</span>}
        {showSession && session && <Link to={`/sessions/${encodeURIComponent(session.key)}`}>{session.title}</Link>}
        {topic && <Link to={`/topic/${topic.id}`}>トピック:{topic.title}</Link>}
      </p>
      {dialogue.turns.map((turn, i) =>
        turn.role === "user" ? (
          <div key={i} className="turn turn-user">
            <span className="turn-label">あなた</span>
            <div className="bubble">
              <Markdown>{turn.text}</Markdown>
            </div>
          </div>
        ) : (
          <div key={i} className="turn turn-assistant">
            <span className="turn-label">Claude</span>
            <Markdown>{turn.text}</Markdown>
          </div>
        ),
      )}
    </article>
  );
}
