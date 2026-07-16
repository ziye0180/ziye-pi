/**
 * 助手消息 markdown 渲染(design.md 富文本渲染,M3 W2 全量增强):
 * - memo 化组件表:流式期间只有正在增长的元素重渲染
 * - shiki 代码高亮 + CodeHeader 复制
 * - mermaid fence → 图(componentsByLanguage 路由)
 * - KaTeX 数学(remark-math + rehype-katex + 分隔符归一化 preprocess)
 * - defer:低优先级解析,打字/滚动不被长消息阻塞
 */
import {
  MarkdownTextPrimitive,
  normalizeMathDelimiters,
  unstable_memoizeMarkdownComponents,
} from "@assistant-ui/react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { memo } from "react";
import "katex/dist/katex.min.css";
import { CodeBlock } from "./markdown/CodeBlock";
import { CodeHeader } from "./markdown/CodeHeader";
import { MermaidDiagram } from "./markdown/MermaidDiagram";

// 常用元素恒等组件表:经 memoize 后按 hast 节点比较,
// 流式期间未变化的元素不再重渲染(样式仍由 .aui-md CSS 提供)
const components = unstable_memoizeMarkdownComponents({
  h1: (props) => <h1 {...props} />,
  h2: (props) => <h2 {...props} />,
  h3: (props) => <h3 {...props} />,
  h4: (props) => <h4 {...props} />,
  p: (props) => <p {...props} />,
  ul: (props) => <ul {...props} />,
  ol: (props) => <ol {...props} />,
  li: (props) => <li {...props} />,
  blockquote: (props) => <blockquote {...props} />,
  a: (props) => <a {...props} target="_blank" rel="noreferrer" />,
  table: (props) => <table {...props} />,
  th: (props) => <th {...props} />,
  td: (props) => <td {...props} />,
  SyntaxHighlighter: CodeBlock,
  CodeHeader,
});

export const MarkdownText = memo(function MarkdownText() {
  return (
    <MarkdownTextPrimitive
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      preprocess={normalizeMathDelimiters}
      defer
      components={components}
      componentsByLanguage={{
        mermaid: { SyntaxHighlighter: MermaidDiagram },
      }}
      className="aui-md"
    />
  );
});
