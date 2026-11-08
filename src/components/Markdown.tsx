import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Mermaid } from "./Mermaid";

type HastNode = { type: string; tagName?: string; value?: string; properties?: { className?: unknown }; children?: HastNode[] };

/** ```mermaid のコードブロックなら、そのコードを返す */
function mermaidCode(pre: HastNode | undefined): string | null {
  const code = pre?.children?.find((c) => c.type === "element" && c.tagName === "code");
  const cls = code?.properties?.className;
  if (!Array.isArray(cls) || !cls.includes("language-mermaid")) return null;
  return (code?.children ?? []).map((c) => c.value ?? "").join("");
}

/** 教材の Markdown を表示する。表はスマホで表の中だけ横スクロールさせ、mermaid のコードは図にする */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ node: _node, ...props }) => (
            <div className="table-wrap">
              <table {...props} />
            </div>
          ),
          pre: ({ node, ...props }) => {
            const code = mermaidCode(node as HastNode | undefined);
            return code !== null ? <Mermaid code={code} /> : <pre {...props} />;
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
