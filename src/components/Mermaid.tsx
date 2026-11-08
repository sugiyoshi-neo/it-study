import { useEffect, useId, useState } from "react";

// mermaid は大きいので、図を表示するときに初めて読み込む
let mermaidPromise: Promise<typeof import("mermaid").default> | undefined;
let renderedTheme: string | undefined;

async function getMermaid(theme: "dark" | "default") {
  mermaidPromise ??= import("mermaid").then((m) => m.default);
  const mermaid = await mermaidPromise;
  if (renderedTheme !== theme) {
    mermaid.initialize({ startOnLoad: false, theme, securityLevel: "strict", fontFamily: "inherit" });
    renderedTheme = theme;
  }
  return mermaid;
}

const isDark = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches;

/** mermaid のコードを図として表示する。描けないときはコードをそのまま見せる */
export function Mermaid({ code }: { code: string }) {
  const id = "mmd" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMermaid(isDark() ? "dark" : "default")
      .then((m) => m.render(id, code))
      .then(({ svg }) => {
        if (!cancelled) setSvg(svg);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
        document.getElementById("d" + id)?.remove(); // 失敗時に mermaid が残す要素を片付ける
      });
    return () => {
      cancelled = true;
    };
  }, [code, id]);

  if (failed) {
    return (
      <div className="diagram diagram-failed">
        <p className="muted">図を表示できませんでした(図のコードを表示します)</p>
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    );
  }
  if (!svg) return <div className="diagram diagram-loading muted">図を読み込み中…</div>;
  return <div className="diagram" dangerouslySetInnerHTML={{ __html: svg }} />;
}
