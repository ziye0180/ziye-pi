/**
 * Mermaid 图渲染(design.md 富文本渲染)。
 * componentsByLanguage 把 mermaid fence 路由到这里。
 *
 * 流式 gate:mermaid 解析半截图必炸,所以只在代码稳定(500ms 未变)后才渲染,
 * 期间显示占位;渲染失败显示错误 + 原文(fail-fast 不白屏)。
 * mermaid 包体大,动态 import 保持首屏 chunk 小(§16 包体预算)。
 */
import type { SyntaxHighlighterProps } from "@assistant-ui/react-markdown";
import { useEffect, useId, useState, type FC } from "react";

let mermaidInit: Promise<typeof import("mermaid").default> | undefined;

/** 单例加载 + 初始化(暗色主题,strict 安全级)。 */
const loadMermaid = () => {
  mermaidInit ??= import("mermaid").then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      darkMode: true,
      securityLevel: "strict",
      fontFamily: "inherit",
    });
    return mermaid;
  });
  return mermaidInit;
};

export const MermaidDiagram: FC<SyntaxHighlighterProps> = ({ code }) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [svg, setSvg] = useState<string>();
  const [error, setError] = useState<string>();
  const [stable, setStable] = useState(false);

  // gate 1:代码 500ms 未变化才认为 fence 已完整(流式期间不解析)
  useEffect(() => {
    setStable(false);
    const timer = setTimeout(() => setStable(true), 500);
    return () => clearTimeout(timer);
  }, [code]);

  useEffect(() => {
    if (!stable) return;
    let alive = true;
    loadMermaid()
      .then((mermaid) => mermaid.render(`mmd-${id}`, code))
      .then(({ svg: rendered }) => {
        if (alive) {
          setSvg(rendered);
          setError(undefined);
        }
      })
      .catch((err: unknown) => {
        if (alive) {
          setError(err instanceof Error ? err.message : String(err));
          console.error("[pi-cockpit] mermaid 渲染失败", err);
        }
      });
    return () => {
      alive = false;
    };
  }, [stable, code, id]);

  if (error) {
    return (
      <div className="my-2 space-y-2">
        <div className="rounded-(--radius-card) border border-danger/40 px-3 py-2 text-[13px] text-danger">
          Mermaid 渲染失败: {error}
        </div>
        <pre className="overflow-x-auto rounded-xl border border-border bg-surface p-3 font-mono text-[13px] text-text-2">
          {code}
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-2 rounded-xl border border-border bg-surface px-3 py-6 text-center text-[13px] text-text-3">
        图生成中…
      </div>
    );
  }

  return (
    <div
      className="my-2 flex justify-center overflow-x-auto rounded-xl border border-border bg-surface p-3 [&_svg]:max-w-full"
      // 安全性:mermaid securityLevel strict 下输出已消毒的自产 SVG
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};
