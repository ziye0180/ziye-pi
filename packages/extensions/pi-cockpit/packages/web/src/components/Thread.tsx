/**
 * pi-cockpit 对话主界面:assistant-ui 无样式 primitives + Grok 暗色皮。
 * 视觉规格 SSOT: docs/design.md;分组渲染逻辑参照官方 examples/with-pi thread.tsx。
 */
import {
  ActionBarPrimitive,
  AuiIf,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  groupPartByType,
  MessagePrimitive,
  ThreadPrimitive,
  useAui,
  useAuiState,
} from "@assistant-ui/react";
import {
  isPiSteerQueueItemId,
  usePiRuntimeExtras,
} from "@assistant-ui/react-pi";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  PencilIcon,
  RefreshCwIcon,
  ListEndIcon,
  MicIcon,
  SquareIcon,
  Trash2Icon,
} from "lucide-react";
import { useState, type FC } from "react";
import {
  ComposerAddAttachment,
  ComposerAttachments,
  UserMessageAttachments,
} from "./Attachments";
import { ActivityBanner, ContextUsage, SessionCost } from "./Dashboard";
import { HostUiRequests } from "./HostUiRequests";
import { MarkdownText } from "./MarkdownText";
import { ModelSelector } from "./ModelSelector";
import { PiDataPart } from "./PiDataPart";
import { ReasoningGroup, ReasoningPart } from "./Reasoning";
import { SlashCommandRoot } from "./SlashCommands";
import { ToolCard } from "./ToolCard";
import { TurnCost } from "./TurnCost";

export const Thread: FC = () => {
  return (
    <ThreadPrimitive.Root className="flex h-full flex-col">
      <ThreadPrimitive.Viewport className="relative flex flex-1 flex-col overflow-y-auto scroll-smooth">
        <div className="mx-auto flex w-full max-w-[44rem] flex-1 flex-col px-4 pt-6">
          <AuiIf condition={(s) => s.thread.isEmpty}>
            <Welcome />
          </AuiIf>

          <div className="mb-10 flex flex-col gap-y-8 empty:hidden">
            <ThreadPrimitive.Messages>
              {() => <ThreadMessage />}
            </ThreadPrimitive.Messages>
          </div>

          <ThreadPrimitive.ViewportFooter className="sticky bottom-0 mt-auto flex flex-col gap-3 bg-bg pb-5">
            <ScrollToBottom />
            <ActivityBanner />
            <ReadinessBanner />
            <LastErrorBanner />
            <HostUiRequests />
            <Composer />
          </ThreadPrimitive.ViewportFooter>
        </div>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};

const Welcome: FC = () => (
  <div className="flex grow flex-col items-center justify-center pb-24">
    <h1 className="animate-rise-in text-2xl font-semibold">
      有什么可以帮你?
    </h1>
    <p className="animate-rise-in mt-2 text-[15px] text-text-2 [animation-delay:75ms]">
      pi cockpit — 你的本地 agent 驾驶舱
    </p>
    <div className="animate-rise-in mt-6 grid w-full max-w-md gap-2 [animation-delay:150ms]">
      <SuggestionButtons />
    </div>
  </div>
);

/** 空态起手建议。ThreadPrimitive.Suggestions 是 follow-up 语义、react-pi 0.0.6
 * 也不透传 suggestions,故空态建议自渲染 + 经 composer 发送。 */
const STARTER_PROMPTS = [
  "解释一下当前项目的结构",
  "这个仓库最近改了什么?",
  "帮我跑一下测试并总结结果",
];

const SuggestionButtons: FC = () => {
  const aui = useAui();
  return (
    <>
      {STARTER_PROMPTS.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => {
            const composer = aui.composer();
            composer.setText(prompt);
            composer.send();
          }}
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-start text-[14px] text-text-2 transition-colors duration-200 hover:bg-surface-2 hover:text-text"
        >
          {prompt}
        </button>
      ))}
    </>
  );
};

const ThreadMessage: FC = () => {
  const role = useAuiState((s) => s.message.role);
  if (role === "user") return <UserMessage />;
  return <AssistantMessage />;
};

/** 编辑态 composer:user 气泡原位变身输入框(pi 无原地编辑,
 * 发送 = rewind 到该消息前 + 发新文本,旧分支保留在会话树里)。 */
const EditComposer: FC = () => (
  <ComposerPrimitive.Root className="w-full max-w-[85%] rounded-(--radius-bubble) border border-border-strong bg-surface-2 p-2.5">
    <ComposerPrimitive.Input
      autoFocus
      cancelOnEscape
      className="max-h-40 w-full resize-none bg-transparent text-[15px] leading-relaxed text-text outline-none"
    />
    <div className="mt-2 flex justify-end gap-2">
      <ComposerPrimitive.Cancel asChild>
        <button
          type="button"
          className="rounded-md px-2.5 py-1 text-[13px] text-text-2 transition-colors duration-200 hover:text-text"
        >
          取消
        </button>
      </ComposerPrimitive.Cancel>
      <ComposerPrimitive.Send asChild>
        <button
          type="button"
          className="rounded-md bg-white/90 px-2.5 py-1 text-[13px] font-medium text-black transition-colors duration-200 hover:bg-white disabled:opacity-40"
        >
          发送
        </button>
      </ComposerPrimitive.Send>
    </div>
  </ComposerPrimitive.Root>
);

const UserActionBar: FC = () => (
  <ActionBarPrimitive.Root
    hideWhenRunning
    autohide="always"
    className="flex items-center gap-1 text-text-3"
  >
    <ActionBarPrimitive.Edit asChild>
      <button
        type="button"
        aria-label="编辑"
        className="rounded-md p-1 transition-colors duration-200 hover:text-text"
      >
        <PencilIcon className="size-3.5" />
      </button>
    </ActionBarPrimitive.Edit>
  </ActionBarPrimitive.Root>
);

/** 分支切换器(design.md A1 王牌链):仅当该 user 消息在会话树上有兄弟
 * 分支(edit/重新生成产生)时出现;切换经 pi navigateTree 真实换路径。
 * 显隐用 AuiIf 控制:0.14.26 的 hideWhenSingleBranch 会把多分支也一并藏掉。 */
const UserBranchPicker: FC = () => (
  <AuiIf condition={(s) => s.message.branchCount > 1}>
    <BranchPickerPrimitive.Root className="flex items-center gap-1 text-[12px] text-text-3">
    <BranchPickerPrimitive.Previous asChild>
      <button
        type="button"
        aria-label="上一个分支"
        className="rounded-md p-0.5 transition-colors duration-200 hover:text-text disabled:opacity-40"
      >
        <ChevronLeftIcon className="size-3.5" />
      </button>
    </BranchPickerPrimitive.Previous>
    <span>
      <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
    </span>
    <BranchPickerPrimitive.Next asChild>
      <button
        type="button"
        aria-label="下一个分支"
        className="rounded-md p-0.5 transition-colors duration-200 hover:text-text disabled:opacity-40"
      >
        <ChevronRightIcon className="size-3.5" />
      </button>
    </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  </AuiIf>
);

const UserMessage: FC = () => (
  <MessagePrimitive.Root
    data-role="user"
    className="animate-rise-in flex flex-col items-end gap-1.5"
  >
    <UserMessageAttachments />
    <AuiIf condition={(s) => s.composer.isEditing}>
      <EditComposer />
    </AuiIf>
    <AuiIf condition={(s) => !s.composer.isEditing}>
      <div className="max-w-[85%] rounded-(--radius-bubble) bg-surface-2 px-4 py-2.5 wrap-break-word empty:hidden">
        <MessagePrimitive.Parts />
      </div>
      <div className="flex items-center gap-2">
        <UserBranchPicker />
        <UserActionBar />
      </div>
    </AuiIf>
  </MessagePrimitive.Root>
);

const AssistantMessage: FC = () => (
  <MessagePrimitive.Root
    data-role="assistant"
    className="animate-rise-in leading-relaxed wrap-break-word"
  >
    <MessagePrimitive.GroupedParts
      groupBy={groupPartByType({
        reasoning: ["group-chainOfThought", "group-reasoning"],
        "tool-call": ["group-chainOfThought", "group-tool"],
        "standalone-tool-call": [],
      })}
    >
      {({ part, children }) => {
        switch (part.type) {
          case "group-chainOfThought":
            return <div>{children}</div>;
          case "group-reasoning":
            return (
              <ReasoningGroup running={part.status.type === "running"}>
                {children}
              </ReasoningGroup>
            );
          case "group-tool":
            return <div>{children}</div>;
          case "text":
            return <MarkdownText />;
          case "reasoning":
            return <ReasoningPart text={part.text} />;
          case "tool-call":
            return part.toolUI ?? <ToolCard {...part} />;
          case "data":
            return <PiDataPart part={part} />;
          case "indicator":
            return (
              <span
                className="animate-pulse-dot text-text-2"
                aria-label="正在工作"
              >
                ●
              </span>
            );
          default:
            return null;
        }
      }}
    </MessagePrimitive.GroupedParts>
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="mt-2 rounded-(--radius-card) border border-danger/40 p-3 text-[13px] text-danger">
        <ErrorPrimitive.Message />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
    <div className="mt-1.5 ms-2 flex items-center gap-3">
      <AssistantActionBar />
      <TurnCost />
    </div>
  </MessagePrimitive.Root>
);

/** assistant 消息操作条(design.md W4):复制 + 导出(溢出菜单),hover 浮现。 */
const AssistantActionBar: FC = () => (
  <ActionBarPrimitive.Root
    hideWhenRunning
    autohide="not-last"
    className="flex items-center gap-1 text-text-3"
  >
    <ActionBarPrimitive.Copy asChild>
      <button
        type="button"
        aria-label="复制"
        className="rounded-md p-1 transition-colors duration-200 hover:text-text"
      >
        <AuiIf condition={(s) => s.message.isCopied}>
          <CheckIcon className="size-3.5" />
        </AuiIf>
        <AuiIf condition={(s) => !s.message.isCopied}>
          <CopyIcon className="size-3.5" />
        </AuiIf>
      </button>
    </ActionBarPrimitive.Copy>
    <ActionBarPrimitive.Reload asChild>
      <button
        type="button"
        aria-label="重新生成"
        className="rounded-md p-1 transition-colors duration-200 hover:text-text"
      >
        <RefreshCwIcon className="size-3.5" />
      </button>
    </ActionBarPrimitive.Reload>
    <ActionBarPrimitive.ExportMarkdown asChild>
      <button
        type="button"
        aria-label="导出 Markdown"
        className="rounded-md p-1 transition-colors duration-200 hover:text-text"
      >
        <DownloadIcon className="size-3.5" />
      </button>
    </ActionBarPrimitive.ExportMarkdown>
  </ActionBarPrimitive.Root>
);

const ScrollToBottom: FC = () => (
  <ThreadPrimitive.ScrollToBottom asChild>
    <button
      type="button"
      aria-label="滚动到底部"
      className="absolute -top-12 self-center rounded-full border border-border bg-surface p-2.5 text-text-2 transition-colors duration-200 hover:text-text disabled:invisible"
    >
      <ArrowDownIcon className="size-4" />
    </button>
  </ThreadPrimitive.ScrollToBottom>
);

/** readiness 门禁(FE-3 error 态):非 ready 时给出可执行的下一步。
 * undefined = 初始快照未达(loading 态),不渲染 banner 避免闪现。 */
const ReadinessBanner: FC = () => {
  const { readiness } = usePiRuntimeExtras();
  if (!readiness || readiness.state === "ready") return null;
  return (
    <div className="rounded-(--radius-card) border border-border bg-surface px-4 py-2.5 text-[13px] text-text-2">
      {readiness.message}
    </div>
  );
};

/** runtime/session 层错误(SSE error 事件等)的可见反馈(FE-3 error 态)。 */
const LastErrorBanner: FC = () => {
  const { lastError } = usePiRuntimeExtras();
  if (!lastError) return null;
  return (
    <div className="rounded-(--radius-card) border border-danger/40 bg-surface px-4 py-2.5 text-[13px] text-danger">
      {lastError}
    </div>
  );
};

/** pi 的 mid-run 队列镜像:Enter=followUp,Cmd/Ctrl+Shift+Enter=steer。
 * pi 只支持整队清空,清空文本回填输入框。 */
const QueueCard: FC = () => {
  const aui = useAui();
  const { clearQueue } = usePiRuntimeExtras();
  const queueLength = useAuiState((s) => s.composer.queue.length);
  const [error, setError] = useState<string | null>(null);
  if (queueLength === 0) return null;

  const handleClear = () => {
    setError(null);
    clearQueue()
      .then(({ steering, followUp }) => {
        const restored = [...steering, ...followUp].join("\n");
        if (!restored) return;
        const composer = aui.composer();
        const current = composer.getState().text;
        composer.setText(current ? `${current}\n${restored}` : restored);
      })
      .catch((err: unknown) => {
        console.error("清空队列失败", err);
        setError("清空队列失败");
      });
  };

  return (
    <div className="-mb-6 flex flex-col gap-1.5 rounded-t-(--radius-composer) border border-b-0 border-border bg-surface-2/50 px-4 pt-2.5 pb-8 text-[13px] text-text-2">
      {error && <span className="text-[12px] text-danger">{error}</span>}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">已排队</span>
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs transition-colors duration-200 hover:text-text"
        >
          <Trash2Icon className="size-3" />
          清空
        </button>
      </div>
      <ComposerPrimitive.Queue>
        {({ queueItem }) => (
          <div className="flex items-center gap-2">
            <ListEndIcon className="size-3.5 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{queueItem.prompt}</span>
            {isPiSteerQueueItemId(queueItem.id) && (
              <span className="rounded-full border border-border px-1.5 text-[10px] uppercase">
                steer
              </span>
            )}
          </div>
        )}
      </ComposerPrimitive.Queue>
    </div>
  );
};

const Composer: FC = () => {
  const { readiness } = usePiRuntimeExtras();
  // readiness 只随 thread 快照而来:undefined=未知(空 thread),必须放行——
  // 发送才会创建 thread 并带回快照;只有显式非 ready 才禁发(banner 给出下一步)
  const notReady = readiness !== undefined && readiness.state !== "ready";
  const placeholder = notReady ? "等待 pi 就绪…" : "问点什么…";

  return (
    <ComposerPrimitive.Root className="relative flex w-full flex-col">
      <QueueCard />
      <SlashCommandRoot>
      <ComposerPrimitive.AttachmentDropzone asChild>
        <div className="flex w-full flex-col gap-2 rounded-(--radius-composer) border border-border bg-surface p-2.5 transition-shadow duration-200 focus-within:border-border-strong focus-within:ring-2 focus-within:ring-white/8 data-[dragging=true]:border-dashed data-[dragging=true]:border-border-strong">
          <ComposerAttachments />
          <ComposerPrimitive.Input
            placeholder={placeholder}
            disabled={notReady}
            rows={1}
            autoFocus
            aria-label="消息输入"
            className="max-h-40 min-h-9 w-full resize-none bg-transparent px-1.5 py-1 text-[15px] outline-none placeholder:text-text-3"
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <ModelSelector />
              <ComposerAddAttachment />
              <AuiIf condition={(s) => s.composer.dictation === undefined}>
                <ComposerPrimitive.Dictate asChild>
                  <button
                    type="button"
                    aria-label="语音输入"
                    className="flex size-8 items-center justify-center rounded-md text-text-3 transition-colors duration-200 hover:text-text"
                  >
                    <MicIcon className="size-4" />
                  </button>
                </ComposerPrimitive.Dictate>
              </AuiIf>
              <AuiIf condition={(s) => s.composer.dictation !== undefined}>
                <ComposerPrimitive.StopDictation asChild>
                  <button
                    type="button"
                    aria-label="停止语音"
                    className="flex size-8 items-center justify-center rounded-md text-danger transition-colors duration-200"
                  >
                    <MicIcon className="size-4 animate-pulse-dot" />
                  </button>
                </ComposerPrimitive.StopDictation>
              </AuiIf>
            </div>
            <div className="flex items-center gap-2">
              <SessionCost />
              <ContextUsage />
              {/* pi 运行中仍可排队发送(followUp/steer),输入空时才显示停止 */}
              <AuiIf condition={(s) => !s.thread.isRunning || !s.composer.isEmpty}>
                <ComposerPrimitive.Send asChild>
                  <button
                    type="button"
                    aria-label="发送"
                    disabled={notReady}
                    className="flex size-8 items-center justify-center rounded-full bg-accent text-accent-fg transition-opacity duration-200 disabled:bg-surface-2 disabled:text-text-3"
                  >
                    <ArrowUpIcon className="size-4" />
                  </button>
                </ComposerPrimitive.Send>
              </AuiIf>
              <AuiIf condition={(s) => s.thread.isRunning && s.composer.isEmpty}>
                <ComposerPrimitive.Cancel asChild>
                  <button
                    type="button"
                    aria-label="停止生成"
                    className="flex size-8 items-center justify-center rounded-full bg-accent text-accent-fg"
                  >
                    <SquareIcon className="size-3 fill-current" />
                  </button>
                </ComposerPrimitive.Cancel>
              </AuiIf>
            </div>
          </div>
        </div>
      </ComposerPrimitive.AttachmentDropzone>
      </SlashCommandRoot>
    </ComposerPrimitive.Root>
  );
};
