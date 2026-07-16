/**
 * 斜杠命令(design.md W5;热身批升级 /export 原生化 + 新增 /compact)。
 * 命令映射:
 *   /new     新会话(本地动作)
 *   /clear   清空排队消息(extras.clearQueue)
 *   /export  pi 原生 HTML 导出(vendored 契约 exportHtml)
 *   /compact 手动压缩上下文(vendored 契约 compact,进度走事件流横幅)
 * /export 与 /compact 依赖已物化 thread(remoteId 存在),新对话不出现。
 *
 * ⚠️ Unstable_ API:官方标注 "may change without notice"(0.14.26)。
 * 已按任务包接受漂移风险,升级 assistant-ui 时需回归此文件。
 */
import { ComposerPrimitive, useAui, useAuiState } from "@assistant-ui/react";
import { usePiRuntimeExtras } from "@assistant-ui/react-pi";
import { unstable_useSlashCommandAdapter } from "@assistant-ui/react";
import type { FC } from "react";
import { piClient } from "../PiRuntimeProvider";

/** 下载 pi 原生自包含 HTML 会话文档。失败冒泡 console(fail fast)。 */
const exportSessionHtml = async (threadId: string): Promise<void> => {
  try {
    const html = await piClient.exportHtml(threadId);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pi-session-${threadId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("[pi-cockpit] 导出会话失败", error);
  }
};

/** 弹层:包住 composer 输入区(TriggerPopover 需 Root 内 + 能读 input)。 */
export const SlashCommandRoot: FC<{ children: React.ReactNode }> = ({ children }) => {
  const aui = useAui();
  const { clearQueue } = usePiRuntimeExtras();
  const threadId = useAuiState((s) => s.threadListItem.remoteId);

  const slash = unstable_useSlashCommandAdapter({
    commands: [
      {
        id: "new",
        label: "新对话",
        description: "开始一个新会话",
        execute: () => aui.threads().switchToNewThread(),
      },
      {
        id: "clear",
        label: "清空队列",
        description: "清空排队的消息",
        execute: () => {
          void clearQueue();
        },
      },
      ...(threadId
        ? [
            {
              id: "export",
              label: "导出会话",
              description: "下载 pi 原生 HTML 会话文档",
              execute: () => {
                void exportSessionHtml(threadId);
              },
            },
            {
              id: "compact",
              label: "压缩上下文",
              description: "手动触发上下文压缩",
              execute: () => {
                // 进度经事件流 compaction_start/end 显示在 ActivityBanner
                piClient.compact(threadId).catch((error: unknown) => {
                  console.error("[pi-cockpit] 手动压缩失败", error);
                });
              },
            },
          ]
        : []),
    ],
    removeOnExecute: true,
  });

  return (
    <ComposerPrimitive.Unstable_TriggerPopoverRoot>
      {children}
      <ComposerPrimitive.Unstable_TriggerPopover
        char="/"
        adapter={slash.adapter}
        className="absolute bottom-full left-0 z-50 mb-2 w-64 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-lg"
      >
        <ComposerPrimitive.Unstable_TriggerPopover.Action {...slash.action} />
        <ComposerPrimitive.Unstable_TriggerPopoverItems>
          {(items) =>
            items.map((item) => (
              <ComposerPrimitive.Unstable_TriggerPopoverItem
                key={item.id}
                item={item}
                className="flex w-full flex-col rounded-lg px-3 py-1.5 text-start transition-colors duration-200 hover:bg-surface-2 data-[highlighted]:bg-surface-2"
              >
                <span className="text-[14px] text-text">/{item.id}</span>
                {item.description && (
                  <span className="text-[12px] text-text-3">{item.description}</span>
                )}
              </ComposerPrimitive.Unstable_TriggerPopoverItem>
            ))
          }
        </ComposerPrimitive.Unstable_TriggerPopoverItems>
      </ComposerPrimitive.Unstable_TriggerPopover>
    </ComposerPrimitive.Unstable_TriggerPopoverRoot>
  );
};
