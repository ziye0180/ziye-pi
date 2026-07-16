/**
 * 把浏览器侧 PiClient(HTTP/SSE,经 vite proxy 打到 bridge 的 /api/pi)
 * 接入 usePiRuntime。client 全应用生命周期稳定。
 */
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { createPiHttpClient, usePiRuntime } from "@assistant-ui/react-pi";
import { useMemo, type ReactNode } from "react";

export function PiRuntimeProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => createPiHttpClient(), []);
  const runtime = usePiRuntime({
    client,
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
