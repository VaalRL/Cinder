import { Fragment, type ReactNode } from "react";

interface Rule {
  name: "code" | "link" | "bold" | "strike" | "italic";
  re: RegExp;
}

// 順序即優先序：code 內容為字面值；bold 在 italic 之前以正確處理 **。
const RULES: Rule[] = [
  { name: "code", re: /`([^`]+)`/ },
  { name: "link", re: /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/ },
  { name: "bold", re: /\*\*(.+?)\*\*/ },
  { name: "strike", re: /~~(.+?)~~/ },
  { name: "italic", re: /\*(.+?)\*/ },
  { name: "italic", re: /_(.+?)_/ },
];

/** 將單行文字解析為帶有行內格式的 React 節點（信任邊界安全：不注入 HTML）。 */
function parseInline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let rest = text;
  let counter = 0;

  while (rest.length > 0) {
    let best: { index: number; rule: Rule; match: RegExpExecArray } | null = null;
    for (const rule of RULES) {
      const match = rule.re.exec(rest);
      if (match && (best === null || match.index < best.index)) {
        best = { index: match.index, rule, match };
      }
    }
    if (!best) {
      nodes.push(rest);
      break;
    }

    if (best.index > 0) nodes.push(rest.slice(0, best.index));
    const inner = best.match[1] ?? "";
    const key = `${keyBase}-${counter++}`;

    switch (best.rule.name) {
      case "code":
        nodes.push(<code key={key}>{inner}</code>);
        break;
      case "link":
        nodes.push(
          <a key={key} href={best.match[2]} target="_blank" rel="noopener noreferrer">
            {parseInline(inner, key)}
          </a>,
        );
        break;
      case "bold":
        nodes.push(<strong key={key}>{parseInline(inner, key)}</strong>);
        break;
      case "strike":
        nodes.push(<s key={key}>{parseInline(inner, key)}</s>);
        break;
      case "italic":
        nodes.push(<em key={key}>{parseInline(inner, key)}</em>);
        break;
    }
    rest = rest.slice(best.index + best.match[0].length);
  }
  return nodes;
}

/** 將訊息文字渲染為支援行內 Markdown（粗體/斜體/刪除線/行內碼/連結）的節點。 */
export function renderMarkdown(text: string): ReactNode {
  return text.split("\n").map((line, i) => (
    <Fragment key={i}>
      {i > 0 ? <br /> : null}
      {parseInline(line, String(i))}
    </Fragment>
  ));
}
