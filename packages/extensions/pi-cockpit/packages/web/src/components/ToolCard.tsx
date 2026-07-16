/**
 * 工具调用卡(design.md 规格):工具名 + 状态点,args/result 折叠。
 * 作为 GroupedParts 里 "tool-call" part 的 fallback 渲染器。
 */
import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import { ChevronRightIcon } from "lucide-react";
import { useState, type FC } from "react";

const resultText = (result: unknown): string => {
  if (result == null) return "";
  if (typeof result === "string") return result;
  try {
    return JSON.stringify(result, null, 2);
  } catch {
    return String(result);
  }
};

export const ToolCard: FC<ToolCallMessagePartProps> = ({
  toolName,
  argsText,
  result,
  status,
}) => {
  const [open, setOpen] = useState(false);
  const running = status.type === "running";
  const waiting = status.type === "requires-action";
  const failed = status.type === "incomplete";
  const output = resultText(result);

  return (
    <div className="my-1.5 rounded-(--radius-card) border border-border bg-surface text-[13px]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-start transition-colors duration-200 hover:bg-surface-2/60"
      >
        <ChevronRightIcon
          className="size-3.5 shrink-0 text-text-3 transition-transform duration-250 ease-(--ease-cockpit) data-[open=true]:rotate-90"
          data-open={open}
        />
        <span className="font-mono text-text">{toolName}</span>
        <span
          className={
            running
              ? "animate-pulse-dot text-text-2"
              : waiting
                ? "text-text-2"
                : failed
                  ? "text-danger"
                  : "text-text-3"
          }
        >
          {running ? "●" : waiting ? "◌" : failed ? "✕" : "✓"}
        </span>
      </button>
      <div className="collapse-grid" data-open={open}>
        <div>
          <div className="space-y-2 border-t border-border px-3 py-2">
            {argsText && (
              <pre className="overflow-x-auto font-mono text-[12px] leading-relaxed text-text-2 whitespace-pre-wrap">
                {argsText}
              </pre>
            )}
            {output && (
              <pre className="max-h-64 overflow-auto rounded-lg bg-bg p-2 font-mono text-[12px] leading-relaxed text-text-2 whitespace-pre-wrap">
                {output}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
