/**
 * 仪表组件(design.md 仪表盘,M3 W3)。数据全部来自 react-pi extras——
 * contextUsage / compaction / retry,零 pi 后端改动。
 */
import { usePiRuntimeExtras } from "@assistant-ui/react-pi";
import type { FC } from "react";

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
