/**
 * 每 turn 用量/成本(design.md 仪表盘,M3 W3)。
 * assistant 消息 metadata.custom.pi.usage 自带 tokens + cost,零后端改动。
 */
import { useAuiState } from "@assistant-ui/react";
import type { FC } from "react";

type PiUsage = {
  input: number;
  output: number;
  totalTokens: number;
  cost?: { total?: number };
};
type PiMeta = { usage?: PiUsage; model?: string };

export const TurnCost: FC = () => {
  const pi = useAuiState((s) => {
    const custom = s.message.metadata?.custom as
      | { pi?: PiMeta }
      | undefined;
    return custom?.pi;
  });
  const usage = pi?.usage;
  if (!usage) return null;

  const cost = usage.cost?.total;
  return (
    <span className="text-[12px] text-text-3" title={pi?.model}>
      {usage.input}↑ {usage.output}↓ tokens
      {typeof cost === "number" && cost > 0 ? ` · $${cost.toFixed(4)}` : ""}
    </span>
  );
};
