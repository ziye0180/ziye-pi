/**
 * pi 特殊消息卡(design.md 仪表盘,M3 W3)。
 * react-pi 把非 assistant/tool 的 pi 消息投影成 DataMessagePart:
 *   pi-bash-execution / pi-branch-summary / pi-compaction-summary /
 *   pi-custom-message / pi-unsupported-message
 * 之前 GroupedParts default 返回 null 让它们全隐身,这里按 name 分发。
 */
import { ChevronRightIcon } from "lucide-react";
import { useState, type FC, type ReactNode } from "react";

type DataPart = { type: "data"; name: string; data: unknown };

const asRecord = (data: unknown): Record<string, unknown> =>
  data != null && typeof data === "object" ? (data as Record<string, unknown>) : {};

const str = (v: unknown): string =>
  v == null ? "" : typeof v === "string" ? v : String(v);

/** 通用折叠壳。 */
const Collapsible: FC<{ title: ReactNode; children: ReactNode; defaultOpen?: boolean }> = ({
  title,
  children,
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="my-1.5 rounded-(--radius-card) border border-border bg-surface text-[13px]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-start text-text-2 transition-colors duration-200 hover:bg-surface-2/60"
      >
        <ChevronRightIcon
          className="size-3.5 shrink-0 text-text-3 transition-transform duration-250 ease-(--ease-cockpit) data-[open=true]:rotate-90"
          data-open={open}
        />
        {title}
      </button>
      <div className="collapse-grid" data-open={open}>
        <div>
          <div className="border-t border-border px-3 py-2">{children}</div>
        </div>
      </div>
    </div>
  );
};

export const PiDataPart: FC<{ part: DataPart }> = ({ part }) => {
  const d = asRecord(part.data);

  if (part.name === "pi-bash-execution") {
    const exitCode = d["exitCode"];
    const failed = typeof exitCode === "number" && exitCode !== 0;
    return (
      <div className="my-1.5 overflow-hidden rounded-(--radius-card) border border-border">
        <div className="flex items-center gap-2 bg-surface-2 px-3 py-1.5 font-mono text-[12px] text-text-3">
          <span className="text-text-2">$</span>
          <span className="min-w-0 flex-1 truncate text-text">{str(d["command"])}</span>
          {failed && <span className="text-danger">exit {String(exitCode)}</span>}
        </div>
        {str(d["output"]) && (
          <pre className="max-h-64 overflow-auto bg-bg p-2 font-mono text-[12px] leading-relaxed text-text-2 whitespace-pre-wrap">
            {str(d["output"])}
          </pre>
        )}
      </div>
    );
  }

  if (part.name === "pi-compaction-summary") {
    return (
      <Collapsible title={<span>上下文已压缩</span>}>
        <div className="text-text-2 whitespace-pre-wrap">{str(d["summary"])}</div>
      </Collapsible>
    );
  }

  if (part.name === "pi-branch-summary") {
    return (
      <Collapsible title={<span>分支摘要</span>}>
        <div className="text-text-2 whitespace-pre-wrap">{str(d["summary"])}</div>
      </Collapsible>
    );
  }

  // pi-custom-message / pi-unsupported-message / 未知 → 通用 JSON 折叠卡
  return (
    <Collapsible title={<span className="font-mono text-[12px]">{part.name}</span>}>
      <pre className="max-h-64 overflow-auto font-mono text-[12px] text-text-3 whitespace-pre-wrap">
        {JSON.stringify(part.data, null, 2)}
      </pre>
    </Collapsible>
  );
};
