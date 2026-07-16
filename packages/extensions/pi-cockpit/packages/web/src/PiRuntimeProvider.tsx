/**
 * 把浏览器侧 PiClient(HTTP/SSE,经 vite proxy 打到 bridge 的 /api/pi)
 * 接入 usePiRuntime。client 全应用生命周期稳定。
 */
import {
  AssistantRuntimeProvider,
  CompositeAttachmentAdapter,
  SimpleImageAttachmentAdapter,
  SimpleTextAttachmentAdapter,
  WebSpeechDictationAdapter,
  WebSpeechSynthesisAdapter,
  type FeedbackAdapter,
} from "@assistant-ui/react";
import { createPiHttpClient, usePiRuntime } from "@assistant-ui/react-pi";
import { useMemo, type ReactNode } from "react";

/** 反馈落盘到 bridge(/api/cockpit,与 pi 契约隔离);失败冒泡 console。 */
const feedbackAdapter: FeedbackAdapter = {
  submit: ({ message, type }) => {
    void fetch("/api/cockpit/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messageId: message.id, type }),
    }).catch((error: unknown) =>
      console.error("[pi-cockpit] 提交反馈失败", error),
    );
  },
};

/** URL <-> 当前会话同步:?t=<threadId>,刷新/直链回到同一会话。 */
const readThreadIdFromUrl = (): string | undefined =>
  new URLSearchParams(window.location.search).get("t") ?? undefined;

const writeThreadIdToUrl = (id: string | undefined): void => {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set("t", id);
  else url.searchParams.delete("t");
  window.history.replaceState(null, "", url);
};

export function PiRuntimeProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => createPiHttpClient(), []);
  const initialThreadId = useMemo(readThreadIdFromUrl, []);
  // 附件:图片(data-URL 直达 pi 的 image content)+ 文本文件(并入 text)。
  // pi 内容模型只收 text/image,其余类型 adapter add 时会抛错并提示。
  const adapters = useMemo(
    () => ({
      attachments: new CompositeAttachmentAdapter([
        new SimpleImageAttachmentAdapter(),
        new SimpleTextAttachmentAdapter(),
      ]),
      // 浏览器本地 WebSpeech,不经 pi;朗读回复 + 语音听写输入
      speech: new WebSpeechSynthesisAdapter(),
      dictation: new WebSpeechDictationAdapter(),
      feedback: feedbackAdapter,
    }),
    [],
  );
  const runtime = usePiRuntime({
    client,
    adapters,
    ...(initialThreadId ? { initialThreadId } : {}),
    onThreadIdChange: writeThreadIdToUrl,
    // fail fast:runtime 内部错误(初始加载/enqueue/resume 失败)不许无声,
    // 冒泡到 console;用户可见反馈由 LastErrorBanner 渲染 extras.lastError
    onError: (error) => {
      console.error("[pi-cockpit] runtime error", error);
    },
  });
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
