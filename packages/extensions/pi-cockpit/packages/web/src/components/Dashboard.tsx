/**
 * 仪表组件(design.md 仪表盘,M3 W3 + 热身批 session-stats)。
 * contextUsage / compaction / retry 来自 react-pi extras;
 * 会话累计成本走 PiClient.getSessionStats(vendored 契约新增)。
 */
import { useAuiState } from "@assistant-ui/react";
import { usePiRuntimeExtras } from "@assistant-ui/react-pi";
import { useEffect, useState, type FC } from "react";
import { piClient } from "../PiRuntimeProvider";

/** context 用量:composer 内小型百分比,>80% 提示(不用告警色,遵守禁装饰)。 */
export const ContextUsage: FC = () => {
  const { contextUsage } = usePiRuntimeExtras();
  if (!contextUsage || contextUsage.percent == null) return null;
  const pct = Math.round(contextUsage.percent);
  const hot = pct >= 80;
  return (
    <span
      title={`${contextUsage.tokens ?? "?"} / ${contextUsage.contextWindow} tokens`}
      className={
        hot
          ? "text-[12px] font-semibold text-text-2"
          : "text-[12px] text-text-3"
      }
    >
      {pct}%
    </span>
  );
};

/** 会话累计成本:thread 物化后拉取,每次 run 结束(running→非 running)刷新。
 * threadId 用 remoteId(物化前 undefined),避免打到 "__pending__" 假 id。 */
export const SessionCost: FC = () => {
  const threadId = useAuiState((s) => s.threadListItem.remoteId);
  const { status } = usePiRuntimeExtras();
  const [cost, setCost] = useState<number | null>(null);
  const running = status === "running";

  useEffect(() => {
    if (!threadId || running) return;
    let alive = true;
    piClient
      .getSessionStats(threadId)
      .then((stats) => {
        if (alive) setCost(stats.cost);
      })
      .catch((error: unknown) => {
        console.error("[pi-cockpit] 拉取会话统计失败", error);
      });
    return () => {
      alive = false;
    };
  }, [threadId, running]);

  // thread 切换时旧值立即失效,避免串台显示
  useEffect(() => {
    setCost(null);
  }, [threadId]);

  if (cost == null) return null;
  return (
    <span className="text-[12px] text-text-3" title="会话累计成本">
      Σ ${cost.toFixed(4)}
    </span>
  );
};

/** compaction / auto-retry 进行中横幅:告诉用户"不是卡死,在干活"。 */
export const ActivityBanner: FC = () => {
  const { compaction, retry } = usePiRuntimeExtras();
  const message = compaction.active
    ? "正在压缩上下文…"
    : retry.active
      ? `自动重试 #${retry.attempt}`
      : null;
  if (!message) return null;
  return (
    <div className="animate-rise-in rounded-(--radius-card) border border-border bg-surface px-4 py-2.5 text-[13px] text-text-2">
      <span className="animate-pulse-dot">{message}</span>
    </div>
  );
};
