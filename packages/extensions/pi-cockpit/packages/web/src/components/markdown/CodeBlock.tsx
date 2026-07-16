/**
 * shiki 语法高亮(design.md 富文本渲染)。
 * 注册进 MarkdownTextPrimitive components.SyntaxHighlighter;
 * react-shiki/web 精简 bundle,双主题按 cockpit 暗色单主题即可,
 * delay 做流式节流。背景由容器 CSS 给(.aui-md 覆盖 shiki 内联底色)。
 */
import type { SyntaxHighlighterProps } from "@assistant-ui/react-markdown";
import ShikiHighlighter from "react-shiki/web";
import { memo, type FC } from "react";

const CodeBlockImpl: FC<SyntaxHighlighterProps> = ({ language, code }) => (
  <ShikiHighlighter
    language={language || "text"}
    theme="github-dark-default"
    delay={120}
    addDefaultStyles={false}
    showLanguage={false}
    className="shiki-block"
  >
    {code}
  </ShikiHighlighter>
);

export const CodeBlock = memo(
  CodeBlockImpl,
  (prev, next) => prev.code === next.code && prev.language === next.language,
);
