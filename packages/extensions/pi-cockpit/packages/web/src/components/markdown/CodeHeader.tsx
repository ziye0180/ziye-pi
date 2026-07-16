/**
 * 代码块头(design.md 富文本渲染):语言名 + 复制按钮。
 * 注册进 MarkdownTextPrimitive components.CodeHeader,渲染在代码体上方。
 */
import type { CodeHeaderProps } from "@assistant-ui/react-markdown";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useRef, useState, type FC } from "react";

export const CodeHeader: FC<CodeHeaderProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const copy = () => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 1500);
      })
      .catch((error: unknown) => {
        console.error("[pi-cockpit] 复制代码失败", error);
      });
  };

  return (
    <div className="flex items-center justify-between rounded-t-xl border border-b-0 border-border bg-surface-2 px-3 py-1.5">
      <span className="font-mono text-[12px] text-text-3">
        {language || "text"}
      </span>
      <button
        type="button"
        aria-label="复制代码"
        onClick={copy}
        className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] text-text-3 transition-colors duration-200 hover:text-text"
      >
        {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
        {copied ? "已复制" : "复制"}
      </button>
    </div>
  );
};
