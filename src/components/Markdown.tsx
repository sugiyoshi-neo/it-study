import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** 教材の Markdown を表示する。表はスマホで表の中だけ横スクロールさせる */
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
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
