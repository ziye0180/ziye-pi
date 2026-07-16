/**
 * 工具调用卡(design.md 规格):工具名 + 状态点,args/result 折叠。
 * 作为 GroupedParts 里 "tool-call" part 的 fallback 渲染器。
 *
 * M3 W1:承载工具关联的 human-in-the-loop——
 * - confirm → part.approval({id, approved?}),respondToApproval({approved}) 仅在
 *   approved===undefined 且无 resolution 时可调(core message.d.ts 契约)
 * - select/input/editor → part.interrupt({type:'human', payload}),payload 是
 *   react-pi 投影塞入的完整 PiHostUiRequest({requestId,...request}),
 *   resume(PiInterruptAnswer):string=提交值,{dismissed:true}=跳过
 * 待答期间卡强制展开(有阻塞项不许隐身)。
 */
import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import type { PiHostUiRequest } from "@assistant-ui/react-pi";
import { ChevronRightIcon } from "lucide-react";
import { useEffect, useRef, useState, type FC } from "react";

/** 工具耗时:react-pi 投影不写 timing,前端自记 running 起止(design.md 仪表盘)。 */
const useElapsed = (running: boolean, done: boolean): string | null => {
  const startedAt = useRef<number>(undefined);
  const [elapsed, setElapsed] = useState<string | null>(null);
  useEffect(() => {
    if (running && startedAt.current === undefined) {
      startedAt.current = performance.now();
    }
    if (done && startedAt.current !== undefined && elapsed === null) {
      setElapsed(`${((performance.now() - startedAt.current) / 1000).toFixed(1)}s`);
    }
  }, [running, done, elapsed]);
  return elapsed;
};

const resultText = (result: unknown): string => {
  if (result == null) return "";
  if (typeof result === "string") return result;
  try {
    return JSON.stringify(result, null, 2);
  } catch {
    return String(result);
  }
};

/** interrupt.payload 收窄成 PiHostUiRequest;形状不符返回 null(不渲染,fail-safe 不 fail-silent:控制台留证)。 */
const asHostUiRequest = (payload: unknown): PiHostUiRequest | null => {
  if (
    payload != null &&
    typeof payload === "object" &&
    "kind" in payload &&
    ["select", "input", "editor"].includes(String((payload as { kind: unknown }).kind))
  ) {
    return payload as PiHostUiRequest;
  }
  console.error("[pi-cockpit] 未识别的 interrupt payload", payload);
  return null;
};

export const ToolCard: FC<ToolCallMessagePartProps> = ({
  toolName,
  argsText,
  result,
  status,
  approval,
  interrupt,
  respondToApproval,
  resume,
}) => {
  const [open, setOpen] = useState(false);
  const running = status.type === "running";
  const waiting = status.type === "requires-action";
  const failed = status.type === "incomplete";
  const elapsed = useElapsed(running, status.type === "complete" || failed);
  const output = resultText(result);

  const pendingApproval =
    approval && approval.approved === undefined && !approval.resolution;
  const interruptRequest = interrupt ? asHostUiRequest(interrupt.payload) : null;
  const pendingAction = Boolean(pendingApproval || interruptRequest);
  // 有待答项时强制展开,不许折叠隐藏阻塞面
  const expanded = open || pendingAction;

  return (
    <div className="my-1.5 rounded-(--radius-card) border border-border bg-surface text-[13px]">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-start transition-colors duration-200 hover:bg-surface-2/60"
      >
        <ChevronRightIcon
          className="size-3.5 shrink-0 text-text-3 transition-transform duration-250 ease-(--ease-cockpit) data-[open=true]:rotate-90"
          data-open={expanded}
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
        {elapsed && (
          <span className="ms-auto text-[12px] text-text-3">{elapsed}</span>
        )}
      </button>
      <div className="collapse-grid" data-open={expanded}>
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
            {pendingApproval && (
              <ApprovalRow respond={respondToApproval} />
            )}
            {interruptRequest && (
              <InterruptRow request={interruptRequest} resume={resume} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/** confirm 审批行:批准/拒绝(design.md 工具卡内审批区)。 */
const ApprovalRow: FC<{
  respond: ToolCallMessagePartProps["respondToApproval"];
}> = ({ respond }) => (
  <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
    <span className="text-text">此操作需要你的批准</span>
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => respond({ approved: false })}
        className="rounded-md px-3 py-1 text-text-2 transition-colors duration-200 hover:text-text"
      >
        拒绝
      </button>
      <button
        type="button"
        onClick={() => respond({ approved: true })}
        className="rounded-md bg-accent px-3 py-1 text-accent-fg transition-opacity duration-200"
      >
        批准
      </button>
    </div>
  </div>
);

/** select/input/editor 中断问答行(紧凑版旁路审批卡)。 */
const InterruptRow: FC<{
  request: PiHostUiRequest;
  resume: ToolCallMessagePartProps["resume"];
}> = ({ request, resume }) => {
  const [value, setValue] = useState(
    request.kind === "editor" ? (request.prefill ?? "") : "",
  );

  return (
    <div className="space-y-2 border-t border-border pt-2">
      <div className="text-text">{request.title}</div>
      {request.kind === "select" ? (
        <div className="flex flex-wrap gap-2">
          {request.options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => resume(option)}
              className="rounded-full border border-border bg-surface-2 px-3 py-1 text-text-2 transition-colors duration-200 hover:text-text"
            >
              {option}
            </button>
          ))}
        </div>
      ) : request.kind === "editor" ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
          className="min-h-20 w-full resize-y rounded-md border border-border bg-bg p-2 font-mono text-[12px] text-text outline-none"
        />
      ) : request.kind === "input" ? (
        <input
          value={value}
          placeholder={request.placeholder}
          onChange={(e) => setValue(e.currentTarget.value)}
          className="w-full rounded-md border border-border bg-bg px-2 py-1 text-text outline-none placeholder:text-text-3"
        />
      ) : null}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => resume({ dismissed: true })}
          className="rounded-md px-3 py-1 text-text-2 transition-colors duration-200 hover:text-text"
        >
          跳过
        </button>
        {request.kind !== "select" && (
          <button
            type="button"
            onClick={() => resume(value)}
            className="rounded-md bg-accent px-3 py-1 text-accent-fg transition-opacity duration-200"
          >
            提交
          </button>
        )}
      </div>
    </div>
  );
};
